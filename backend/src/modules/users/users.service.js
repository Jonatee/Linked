const AppError = require("../../utils/app-error");
const User = require("./user.model");
const Profile = require("../profiles/profile.model");
const UserSettings = require("./user-settings.model");
const Follow = require("../follows/follow.model");
const Media = require("../media/media.model");
const postsService = require("../posts/posts.service");
const commentsService = require("../comments/comments.service");
const Reaction = require("../reactions/reaction.model");
const Post = require("../posts/post.model");
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

async function enrichRelationshipUsers(userIds = []) {
  const uniqueIds = [...new Set((userIds || []).filter(Boolean))];

  if (!uniqueIds.length) {
    return new Map();
  }

  const [users, profiles] = await Promise.all([
    User.find({ id: { $in: uniqueIds }, deletedAt: null }).lean(),
    Profile.find({ userId: { $in: uniqueIds } }).lean()
  ]);

  const mediaIds = [...new Set(profiles.flatMap((profile) => [profile.avatarMediaId, profile.bannerMediaId]).filter(Boolean))];
  const mediaItems = mediaIds.length ? await Media.find({ id: { $in: mediaIds }, deletedAt: null }).lean() : [];

  const mediaMap = new Map(mediaItems.map((item) => [item.id, item]));
  const profileMap = new Map(
    profiles.map((profile) => [
      profile.userId,
      {
        ...profile,
        avatarMedia: profile.avatarMediaId ? mediaMap.get(profile.avatarMediaId) || null : null,
        bannerMedia: profile.bannerMediaId ? mediaMap.get(profile.bannerMediaId) || null : null
      }
    ])
  );

  return new Map(
    users.map((user) => [
      user.id,
      {
        ...user,
        profile: profileMap.get(user.id) || null
      }
    ])
  );
}

async function listRelationships(username, query = {}, type = "followers") {
  const { user } = await getUserByUsername(username);
  const limit = Math.min(Math.max(Number(query.limit || 20), 1), 50);
  const cursor = query.cursor ? new Date(query.cursor) : null;
  const baseFilter =
    type === "followers"
      ? { followingId: user.id, status: { $in: ["active", "accepted"] } }
      : { followerId: user.id, status: { $in: ["active", "accepted"] } };

  const relationshipDocs = await Follow.find({
    ...baseFilter,
    ...(cursor && !Number.isNaN(cursor.getTime()) ? { createdAt: { $lt: cursor } } : {})
  })
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = relationshipDocs.length > limit;
  const pageDocs = hasMore ? relationshipDocs.slice(0, limit) : relationshipDocs;
  const relatedUserIds = pageDocs.map((item) => (type === "followers" ? item.followerId : item.followingId));
  const usersMap = await enrichRelationshipUsers(relatedUserIds);

  const items = pageDocs
    .map((item) => {
      const relatedUserId = type === "followers" ? item.followerId : item.followingId;
      const relatedUser = usersMap.get(relatedUserId);

      if (!relatedUser) {
        return null;
      }

      return {
        id: relatedUser.id,
        username: relatedUser.username,
        usernameDisplay: relatedUser.usernameDisplay,
        isVerified: relatedUser.isVerified,
        profile: relatedUser.profile,
        followedAt: item.createdAt,
        postNotificationsEnabled: type === "following" ? Boolean(item.postNotifications) : false
      };
    })
    .filter(Boolean);

  return {
    items,
    pageInfo: {
      nextCursor: hasMore ? pageDocs[pageDocs.length - 1]?.createdAt || null : null,
      hasMore
    }
  };
}

async function listFollowers(username, query = {}) {
  return listRelationships(username, query, "followers");
}

async function listFollowing(username, query = {}) {
  return listRelationships(username, query, "following");
}

async function listUserPosts(username, query, viewerId = null) {
  const { user } = await getUserByUsername(username);
  return postsService.getPostsByAuthor(user.id, query, viewerId);
}

async function listUserComments(username, query, viewerId = null) {
  const { user } = await getUserByUsername(username, viewerId);
  return commentsService.getCommentsByAuthor(user.id, query, viewerId);
}

async function listUserLikes(username, query, viewerId = null) {
  const { user } = await getUserByUsername(username, viewerId);
  const limit = Number(query.limit || 20);
  const cursor = query.cursor ? new Date(query.cursor) : null;
  const reactions = await Reaction.find({
    userId: user.id,
    targetType: "post",
    reactionType: "like",
    ...(cursor ? { createdAt: { $lt: cursor } } : {})
  })
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const postIds = reactions.map((reaction) => reaction.targetId);
  const posts = await Post.find({ id: { $in: postIds }, deletedAt: null, status: "active" }).lean();
  const orderMap = new Map(reactions.map((reaction, index) => [reaction.targetId, index]));
  const orderedPosts = posts.sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));
  const enrichedItems = await postsService.enrichPosts(orderedPosts, viewerId);
  const hasMore = enrichedItems.length > limit;
  const items = hasMore ? enrichedItems.slice(0, limit) : enrichedItems;

  return {
    items,
    pageInfo: {
      nextCursor: hasMore ? reactions[limit - 1]?.createdAt || null : null,
      hasMore
    }
  };
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
  listUserComments,
  listUserLikes,
  blockUser,
  unblockUser
};
