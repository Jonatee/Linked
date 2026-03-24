const AppError = require("../../utils/app-error");
const { extractHashtags, extractMentions } = require("../../utils/helpers");
const { createCursorPagination } = require("../../utils/pagination");
const Post = require("./post.model");
const User = require("../users/user.model");
const Media = require("../media/media.model");
const Follow = require("../follows/follow.model");
const Reaction = require("../reactions/reaction.model");
const Bookmark = require("../bookmarks/bookmark.model");
const Repost = require("../reposts/repost.model");
const Notification = require("../notifications/notification.model");
const Hashtag = require("../search/hashtag.model");
const Profile = require("../profiles/profile.model");
const blockingService = require("../users/blocking.service");

function attachProfileMedia(profile, mediaItems = []) {
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    avatarMedia: mediaItems.find((item) => item.id === profile.avatarMediaId) || null,
    bannerMedia: mediaItems.find((item) => item.id === profile.bannerMediaId) || null
  };
}

function buildAuthorPayload(author, profiles, mediaItems) {
  if (!author) {
    return null;
  }

  const profile = profiles.find((item) => item.userId === author.id) || null;

  return {
    ...author,
    profile: attachProfileMedia(profile, mediaItems)
  };
}

async function enrichPosts(posts, viewerId = null) {
  const safePosts = posts || [];
  const visibleAuthorIds = await blockingService.filterVisibleAuthorIds(
    viewerId,
    safePosts.map((post) => post.authorId)
  );
  const visiblePosts = safePosts.filter((post) => visibleAuthorIds.includes(post.authorId));
  const authorIds = [...new Set(visiblePosts.map((post) => post.authorId).filter(Boolean))];
  const originalPostIds = [...new Set(visiblePosts.map((post) => post.originalPostId).filter(Boolean))];
  const originalPosts = originalPostIds.length
    ? await Post.find({ id: { $in: originalPostIds }, deletedAt: null }).lean()
    : [];
  const originalAuthorIds = [...new Set(originalPosts.map((post) => post.authorId).filter(Boolean))];
  const allAuthorIds = [...new Set([...authorIds, ...originalAuthorIds])];
  const profileItems = await Profile.find({ userId: { $in: allAuthorIds } }).lean();
  const profileMediaIds = [
    ...new Set(profileItems.flatMap((profile) => [profile.avatarMediaId, profile.bannerMediaId].filter(Boolean)))
  ];
  const mediaIds = [
    ...new Set([
      ...safePosts.flatMap((post) => post.mediaIds || []),
      ...originalPosts.flatMap((post) => post.mediaIds || [])
    ])
  ];
  const allMediaIds = [...new Set([...mediaIds, ...profileMediaIds])];
  const targetIds = [...new Set([...visiblePosts.map((post) => post.id), ...originalPostIds].filter(Boolean))];
  const relationshipEntries = viewerId
    ? await Promise.all(authorIds.map(async (authorId) => [authorId, await blockingService.getRelationshipState(viewerId, authorId)]))
    : [];
  const relationshipMap = new Map(relationshipEntries);

  const [authors, profiles, mediaItems, reactions, bookmarks, reposts] = await Promise.all([
    User.find({ id: { $in: allAuthorIds } }).lean(),
    Promise.resolve(profileItems),
    Media.find({ id: { $in: allMediaIds }, deletedAt: null }).lean(),
    viewerId
      ? Reaction.find({
          userId: viewerId,
          targetType: "post",
          targetId: { $in: targetIds },
          reactionType: "like"
        }).lean()
      : [],
    viewerId ? Bookmark.find({ userId: viewerId, postId: { $in: targetIds } }).lean() : [],
    viewerId ? Repost.find({ userId: viewerId, postId: { $in: targetIds } }).lean() : []
  ]);

  return visiblePosts.map((post) => ({
    ...post,
    author: buildAuthorPayload(authors.find((author) => author.id === post.authorId) || null, profiles, mediaItems),
    media: mediaItems.filter((item) => (post.mediaIds || []).includes(item.id)),
    originalPost:
      originalPosts.find((item) => item.id === post.originalPostId) && {
        ...originalPosts.find((item) => item.id === post.originalPostId),
        author: buildAuthorPayload(
          authors.find((author) => author.id === originalPosts.find((item) => item.id === post.originalPostId)?.authorId) || null,
          profiles,
          mediaItems
        ),
        media: mediaItems.filter((item) =>
          (originalPosts.find((entry) => entry.id === post.originalPostId)?.mediaIds || []).includes(item.id)
        ),
        viewerState: {
          liked: reactions.some((reaction) => reaction.targetId === post.originalPostId),
          bookmarked: bookmarks.some((bookmark) => bookmark.postId === post.originalPostId),
          reposted: reposts.some((repost) => repost.postId === post.originalPostId)
        }
      },
    viewerState: {
      liked: reactions.some((reaction) => reaction.targetId === post.id),
      bookmarked: bookmarks.some((bookmark) => bookmark.postId === post.id),
      reposted: reposts.some((repost) => repost.postId === post.id),
      relationship: relationshipMap.get(post.authorId) || {
        isSelf: false,
        following: false,
        blockedByViewer: false,
        hasBlockedViewer: false,
        canInteract: true
      }
    }
  }));
}

async function hydrateMentionIds(content) {
  const usernames = extractMentions(content);
  const users = await User.find({ username: { $in: usernames } }).lean();
  return users.map((user) => user.id);
}

async function bumpHashtags(hashtags) {
  for (const tag of hashtags) {
    await Hashtag.findOneAndUpdate(
      { normalizedTag: tag },
      {
        tag,
        normalizedTag: tag,
        $inc: { usageCount: 1 },
        lastUsedAt: new Date(),
        modifiedAt: new Date()
      },
      { upsert: true, new: true }
    );
  }
}

async function createPost(authorId, payload) {
  if (payload.mediaIds.length > 0) {
    const media = await Media.find({ id: { $in: payload.mediaIds }, ownerId: authorId, deletedAt: null });
    const imageCount = media.filter((item) => item.type === "image").length;
    const videoCount = media.filter((item) => item.type === "video").length;

    if (imageCount > 4 || videoCount > 1 || (imageCount > 0 && videoCount > 0)) {
      throw new AppError("Posts support up to 4 images or 1 video", 400);
    }
  }

  const hashtags = extractHashtags(payload.content || payload.quoteText);
  const mentionUserIds = await hydrateMentionIds(payload.content || payload.quoteText || "");
  await bumpHashtags(hashtags);

  const post = await Post.create({
    authorId,
    type: payload.type,
    visibility: payload.visibility,
    content: payload.content || "",
    plainTextContent: (payload.content || "").toLowerCase(),
    hashtags,
    mentionUserIds,
    mediaIds: payload.mediaIds,
    originalPostId: payload.originalPostId || null,
    quoteText: payload.quoteText || ""
  });

  await User.updateOne({ id: authorId }, { $inc: { "stats.postCount": 1 } });
  await Media.updateMany(
    { id: { $in: payload.mediaIds } },
    { usageStatus: "attached", attachedEntityType: "post", attachedEntityId: post.id, modifiedAt: new Date() }
  );

  return post;
}

async function getFeed(userId, query) {
  const limit = Number(query.limit || 20);
  const following = await Follow.find({ followerId: userId, status: { $in: ["active", "accepted"] } }).lean();
  const prioritizedAuthorIds = await blockingService.filterVisibleAuthorIds(userId, [
    userId,
    ...following.map((item) => item.followingId)
  ]);
  const cursor = query.cursor ? new Date(query.cursor) : null;
  const candidateLimit = Math.max(limit * 4, 80);
  const items = await Post.find({
    ...(cursor ? { createdAt: { $lt: cursor } } : {}),
    deletedAt: null,
    status: "active",
    $or: [
      { authorId: { $in: prioritizedAuthorIds } },
      { visibility: "public" }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(candidateLimit)
    .lean();

  const priorityMap = new Map(prioritizedAuthorIds.map((authorId) => [authorId, true]));
  const orderedItems = [...items].sort((left, right) => {
    const leftPriority = priorityMap.has(left.authorId) ? 1 : 0;
    const rightPriority = priorityMap.has(right.authorId) ? 1 : 0;

    if (leftPriority !== rightPriority) {
      return rightPriority - leftPriority;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  const enriched = await enrichPosts(orderedItems, userId);
  return createCursorPagination({ items: enriched, limit });
}

async function getExplore(query, viewerId = null) {
  const limit = Number(query.limit || 20);
  const cursor = query.cursor ? new Date(query.cursor) : null;
  const visibleAuthorIds = viewerId
    ? await blockingService.filterVisibleAuthorIds(
        viewerId,
        (await Post.find({ visibility: "public", deletedAt: null, status: "active" }).select("authorId").lean()).map(
          (item) => item.authorId
        )
      )
    : null;
  const items = await Post.find({
    ...(visibleAuthorIds ? { authorId: { $in: visibleAuthorIds } } : {}),
    ...(cursor ? { createdAt: { $lt: cursor } } : {}),
    visibility: "public",
    deletedAt: null,
    status: "active"
  })
    .sort({ createdAt: -1, "stats.likeCount": -1 })
    .limit(limit + 1)
    .lean();

  const enriched = await enrichPosts(items, viewerId);
  return createCursorPagination({ items: enriched, limit });
}

async function getPost(postId, viewerId = null) {
  const post = await Post.findOne({ id: postId, deletedAt: null }).lean();
  if (!post) {
    throw new AppError("Post not found", 404);
  }
  if (viewerId) {
    await blockingService.assertCanInteract(viewerId, post.authorId, "This post is not available");
  }
  const [enriched] = await enrichPosts([post], viewerId);
  return enriched;
}

async function getPostsByAuthor(authorId, query = {}, viewerId = null) {
  const limit = Number(query.limit || 20);
  const cursor = query.cursor ? new Date(query.cursor) : null;
  if (viewerId) {
    await blockingService.assertCanInteract(viewerId, authorId, "This profile is not available");
  }
  const items = await Post.find({
    authorId,
    ...(cursor ? { createdAt: { $lt: cursor } } : {}),
    deletedAt: null,
    status: "active"
  })
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const enriched = await enrichPosts(items, viewerId);
  return createCursorPagination({ items: enriched, limit });
}

async function updatePost(userId, postId, payload) {
  const post = await Post.findOne({ id: postId, authorId: userId, deletedAt: null });
  if (!post) {
    throw new AppError("Post not found", 404);
  }

  post.content = payload.content;
  post.plainTextContent = payload.content.toLowerCase();
  post.hashtags = extractHashtags(payload.content);
  post.mentionUserIds = await hydrateMentionIds(payload.content);
  post.isEdited = true;
  post.editedAt = new Date();
  post.modifiedAt = new Date();
  await post.save();

  return post;
}

async function deletePost(userId, postId) {
  const post = await Post.findOneAndUpdate(
    { id: postId, authorId: userId, deletedAt: null },
    { deletedAt: new Date(), status: "removed", modifiedAt: new Date() },
    { new: true }
  );

  if (!post) {
    throw new AppError("Post not found", 404);
  }

  if (["repost", "quote_repost"].includes(post.type) && post.originalPostId) {
    await Promise.all([
      Repost.deleteOne({ userId, postId: post.originalPostId, type: post.type }),
      Post.updateOne({ id: post.originalPostId }, { $inc: { "stats.repostCount": -1 } }),
      User.updateOne({ id: userId }, { $inc: { "stats.repostCount": -1 } })
    ]);
  }

  return { success: true };
}

async function repostPost(userId, postId, payload) {
  const post = await Post.findOne({ id: postId, deletedAt: null }).lean();
  if (!post) {
    throw new AppError("Post not found", 404);
  }

  await blockingService.assertCanInteract(userId, post.authorId, "You cannot repost this post");

  const existing = await Repost.findOne({ userId, postId, type: payload.type }).lean();
  if (existing) {
    const existingRepostPost = await Post.findOne({
      authorId: userId,
      originalPostId: postId,
      type: payload.type,
      deletedAt: null
    }).lean();

    return existingRepostPost || existing;
  }

  await Repost.create({
    userId,
    postId,
    type: payload.type,
    quoteText: payload.quoteText || ""
  });

  const repostPost = await Post.create({
    authorId: userId,
    type: payload.type,
    visibility: "public",
    content: payload.type === "quote_repost" ? payload.quoteText || "" : "",
    plainTextContent: (payload.type === "quote_repost" ? payload.quoteText || "" : "").toLowerCase(),
    hashtags: extractHashtags(payload.quoteText || ""),
    mentionUserIds: await hydrateMentionIds(payload.quoteText || ""),
    mediaIds: [],
    originalPostId: postId,
    quoteText: payload.type === "quote_repost" ? payload.quoteText || "" : ""
  });

  await Post.updateOne({ id: postId }, { $inc: { "stats.repostCount": 1 } });
  await User.updateOne({ id: userId }, { $inc: { "stats.repostCount": 1 } });
  return repostPost;
}

async function toggleBookmark(userId, postId, shouldBookmark) {
  const post = await Post.findOne({ id: postId, deletedAt: null }).lean();
  if (!post) {
    throw new AppError("Post not found", 404);
  }

  await blockingService.assertCanInteract(userId, post.authorId, "You cannot bookmark this post");

  if (shouldBookmark) {
    const existing = await Bookmark.findOne({ userId, postId });
    if (!existing) {
      await Bookmark.create({ userId, postId });
      await Post.updateOne({ id: postId }, { $inc: { "stats.bookmarkCount": 1 } });
      await User.updateOne({ id: userId }, { $inc: { "stats.bookmarkCount": 1 } });
    }
  } else {
    const existing = await Bookmark.findOne({ userId, postId });
    if (existing) {
      await Bookmark.deleteOne({ userId, postId });
      await Post.updateOne({ id: postId }, { $inc: { "stats.bookmarkCount": -1 } });
      await User.updateOne({ id: userId }, { $inc: { "stats.bookmarkCount": -1 } });
    }
  }

  return { success: true };
}

async function toggleReaction(userId, postId, shouldReact) {
  const post = await Post.findOne({ id: postId, deletedAt: null });
  if (!post) {
    throw new AppError("Post not found", 404);
  }

  await blockingService.assertCanInteract(userId, post.authorId, "You cannot react to this post");

  if (shouldReact) {
    const existing = await Reaction.findOne({
      userId,
      targetType: "post",
      targetId: postId,
      reactionType: "like"
    });

    if (!existing) {
      await Reaction.create({
        userId,
        targetType: "post",
        targetId: postId,
        reactionType: "like"
      });
      await Post.updateOne({ id: postId }, { $inc: { "stats.likeCount": 1 } });
      if (post.authorId !== userId) {
        await Notification.create({
          recipientId: post.authorId,
          actorId: userId,
          type: "like_post",
          entityType: "post",
          entityId: postId,
          message: "liked your post"
        });
      }
    }
  } else {
    const existing = await Reaction.findOne({
      userId,
      targetType: "post",
      targetId: postId,
      reactionType: "like"
    });

    if (existing) {
      await Reaction.deleteOne({ userId, targetType: "post", targetId: postId, reactionType: "like" });
      await Post.updateOne({ id: postId }, { $inc: { "stats.likeCount": -1 } });
    }
  }

  return { success: true };
}

module.exports = {
  enrichPosts,
  createPost,
  getFeed,
  getExplore,
  getPost,
  getPostsByAuthor,
  updatePost,
  deletePost,
  repostPost,
  toggleBookmark,
  toggleReaction
};
