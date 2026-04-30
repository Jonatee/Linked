const AppError = require("../../utils/app-error");
const UserSettings = require("./user-settings.model");
const Follow = require("../follows/follow.model");
const User = require("./user.model");

async function getSettingsMap(userIds = []) {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean))];

  if (!uniqueIds.length) {
    return new Map();
  }

  const settings = await UserSettings.find({ userId: { $in: uniqueIds } }).lean();
  return new Map(settings.map((item) => [item.userId, item]));
}

function getBlockedIds(settingsMap, userId) {
  return new Set(settingsMap.get(userId)?.blockedUserIds || []);
}

async function getRelationshipState(viewerId, targetUserId) {
  if (!viewerId || !targetUserId) {
    return {
      isSelf: false,
      following: false,
      blockedByViewer: false,
      hasBlockedViewer: false,
      canInteract: true,
      postNotificationsEnabled: false
    };
  }

  if (viewerId === targetUserId) {
    return {
      isSelf: true,
      following: false,
      blockedByViewer: false,
      hasBlockedViewer: false,
      canInteract: true,
      postNotificationsEnabled: false
    };
  }

  const [settingsMap, followRecord] = await Promise.all([
    getSettingsMap([viewerId, targetUserId]),
    Follow.findOne({
      followerId: viewerId,
      followingId: targetUserId,
      status: { $in: ["active", "accepted"] }
    }).lean()
  ]);

  const viewerBlockedIds = getBlockedIds(settingsMap, viewerId);
  const targetBlockedIds = getBlockedIds(settingsMap, targetUserId);
  const blockedByViewer = viewerBlockedIds.has(targetUserId);
  const hasBlockedViewer = targetBlockedIds.has(viewerId);

  return {
    isSelf: false,
    following: Boolean(followRecord),
    blockedByViewer,
    hasBlockedViewer,
    canInteract: !blockedByViewer && !hasBlockedViewer,
    postNotificationsEnabled: Boolean(followRecord?.postNotifications)
  };
}

async function isBlockedBetween(userAId, userBId) {
  if (!userAId || !userBId || userAId === userBId) {
    return false;
  }

  const settingsMap = await getSettingsMap([userAId, userBId]);
  return getBlockedIds(settingsMap, userAId).has(userBId) || getBlockedIds(settingsMap, userBId).has(userAId);
}

async function assertCanInteract(userAId, userBId, message = "You cannot interact with this user") {
  const blocked = await isBlockedBetween(userAId, userBId);
  if (blocked) {
    throw new AppError(message, 403);
  }
}

async function filterVisibleAuthorIds(viewerId, authorIds = []) {
  const uniqueIds = [...new Set((authorIds || []).filter(Boolean))];

  if (!viewerId || !uniqueIds.length) {
    return uniqueIds;
  }

  const settingsMap = await getSettingsMap([viewerId, ...uniqueIds]);
  const viewerBlockedIds = getBlockedIds(settingsMap, viewerId);

  return uniqueIds.filter((authorId) => {
    if (authorId === viewerId) {
      return true;
    }

    const authorBlockedIds = getBlockedIds(settingsMap, authorId);
    return !viewerBlockedIds.has(authorId) && !authorBlockedIds.has(viewerId);
  });
}

async function blockUser(viewerId, targetUserId) {
  if (viewerId === targetUserId) {
    throw new AppError("You cannot block yourself", 400);
  }

  const viewerSettings = await UserSettings.findOne({ userId: viewerId });
  if (!viewerSettings) {
    throw new AppError("Viewer settings not found", 404);
  }

  if (!viewerSettings.blockedUserIds.includes(targetUserId)) {
    viewerSettings.blockedUserIds.push(targetUserId);
    viewerSettings.modifiedAt = new Date();
    await viewerSettings.save();
  }

  const [outgoingFollow, incomingFollow] = await Promise.all([
    Follow.findOne({ followerId: viewerId, followingId: targetUserId }).lean(),
    Follow.findOne({ followerId: targetUserId, followingId: viewerId }).lean()
  ]);

  await Promise.all([
    Follow.deleteMany({
      $or: [
        { followerId: viewerId, followingId: targetUserId },
        { followerId: targetUserId, followingId: viewerId }
      ]
    }),
    outgoingFollow
      ? Promise.all([
          User.updateOne({ id: viewerId }, { $inc: { "stats.followingCount": -1 } }),
          User.updateOne({ id: targetUserId }, { $inc: { "stats.followerCount": -1 } })
        ])
      : null,
    incomingFollow
      ? Promise.all([
          User.updateOne({ id: targetUserId }, { $inc: { "stats.followingCount": -1 } }),
          User.updateOne({ id: viewerId }, { $inc: { "stats.followerCount": -1 } })
        ])
      : null
  ]);

  return { success: true };
}

async function unblockUser(viewerId, targetUserId) {
  const viewerSettings = await UserSettings.findOne({ userId: viewerId });
  if (!viewerSettings) {
    throw new AppError("Viewer settings not found", 404);
  }

  viewerSettings.blockedUserIds = (viewerSettings.blockedUserIds || []).filter((item) => item !== targetUserId);
  viewerSettings.modifiedAt = new Date();
  await viewerSettings.save();

  return { success: true };
}

module.exports = {
  getRelationshipState,
  isBlockedBetween,
  assertCanInteract,
  filterVisibleAuthorIds,
  blockUser,
  unblockUser
};
