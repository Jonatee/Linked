const AppError = require("../../utils/app-error");
const User = require("./user.model");
const Profile = require("../profiles/profile.model");
const UserSettings = require("./user-settings.model");
const Follow = require("../follows/follow.model");
const Media = require("../media/media.model");
const postsService = require("../posts/posts.service");
const blockingService = require("./blocking.service");

async function getUserByUsername(username, viewerId = null) {
  const normalized = String(username).trim().toLowerCase();
  const user = await User.findOne({ username: normalized, deletedAt: null }).lean();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const [profile, viewerState] = await Promise.all([
    Profile.findOne({ userId: user.id }).lean(),
    blockingService.getRelationshipState(viewerId, user.id)
  ]);

  if (profile) {
    const mediaIds = [profile.avatarMediaId, profile.bannerMediaId].filter(Boolean);
    const mediaItems = mediaIds.length ? await Media.find({ id: { $in: mediaIds }, deletedAt: null }).lean() : [];

    return {
      user,
      profile: {
        ...profile,
        avatarMedia: mediaItems.find((item) => item.id === profile.avatarMediaId) || null,
        bannerMedia: mediaItems.find((item) => item.id === profile.bannerMediaId) || null
      },
      viewerState
    };
  }

  return { user, profile, viewerState };
}

async function updateProfile(userId, payload) {
  return Profile.findOneAndUpdate(
    { userId },
    { ...payload, modifiedAt: new Date() },
    { new: true }
  );
}

async function updateSettings(userId, payload) {
  return UserSettings.findOneAndUpdate(
    { userId },
    { ...payload, modifiedAt: new Date() },
    { new: true }
  );
}

async function listFollowers(username) {
  const { user } = await getUserByUsername(username);
  return Follow.find({ followingId: user.id, status: { $in: ["active", "accepted"] } }).lean();
}

async function listFollowing(username) {
  const { user } = await getUserByUsername(username);
  return Follow.find({ followerId: user.id, status: { $in: ["active", "accepted"] } }).lean();
}

async function listUserPosts(username, query, viewerId = null) {
  const { user } = await getUserByUsername(username);
  return postsService.getPostsByAuthor(user.id, query, viewerId);
}

async function blockUser(viewerId, targetUserId) {
  const targetUser = await User.findOne({ id: targetUserId, deletedAt: null }).lean();
  if (!targetUser) {
    throw new AppError("Target user not found", 404);
  }

  return blockingService.blockUser(viewerId, targetUserId);
}

async function unblockUser(viewerId, targetUserId) {
  const targetUser = await User.findOne({ id: targetUserId, deletedAt: null }).lean();
  if (!targetUser) {
    throw new AppError("Target user not found", 404);
  }

  return blockingService.unblockUser(viewerId, targetUserId);
}

module.exports = {
  getUserByUsername,
  updateProfile,
  updateSettings,
  listFollowers,
  listFollowing,
  listUserPosts,
  blockUser,
  unblockUser
};
