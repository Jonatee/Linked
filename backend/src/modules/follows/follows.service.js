const AppError = require("../../utils/app-error");
const Follow = require("./follow.model");
const User = require("../users/user.model");
const { createNotification } = require("../notifications/notifications.service");
const blockingService = require("../users/blocking.service");

async function followUser(followerId, followingId) {
  if (followerId === followingId) {
    throw new AppError("You cannot follow yourself", 400);
  }

  const targetUser = await User.findOne({ id: followingId, deletedAt: null });
  if (!targetUser) {
    throw new AppError("Target user not found", 404);
  }

  await blockingService.assertCanInteract(followerId, followingId, "You cannot follow this user");

  const existing = await Follow.findOne({ followerId, followingId });
  if (!existing) {
    await Follow.create({
      followerId,
      followingId,
      status: "accepted"
    });

    await User.updateOne({ id: followerId }, { $inc: { "stats.followingCount": 1 } });
    await User.updateOne({ id: followingId }, { $inc: { "stats.followerCount": 1 } });
  }

  await createNotification({
    recipientId: followingId,
    actorId: followerId,
    type: "follow",
    entityType: "user",
    entityId: followerId,
    message: "started following you"
  });

  return { success: true };
}

async function unfollowUser(followerId, followingId) {
  const existing = await Follow.findOne({ followerId, followingId });
  if (existing) {
    await Follow.deleteOne({ followerId, followingId });
    await User.updateOne({ id: followerId }, { $inc: { "stats.followingCount": -1 } });
    await User.updateOne({ id: followingId }, { $inc: { "stats.followerCount": -1 } });
  }
  return { success: true };
}

async function enablePostNotifications(followerId, followingId) {
  await Follow.updateOne({ followerId, followingId }, { postNotifications: true });
  return { success: true };
}

async function disablePostNotifications(followerId, followingId) {
  await Follow.updateOne({ followerId, followingId }, { postNotifications: false });
  return { success: true };
}

module.exports = {
  followUser,
  unfollowUser,
  enablePostNotifications,
  disablePostNotifications
};
