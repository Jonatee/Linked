const AppError = require("../../utils/app-error");
const { extractMentions } = require("../../utils/helpers");
const Comment = require("./comment.model");
const Post = require("../posts/post.model");
const Reaction = require("../reactions/reaction.model");
const Notification = require("../notifications/notification.model");
const User = require("../users/user.model");
const Profile = require("../profiles/profile.model");
const Media = require("../media/media.model");
const notificationService = require("../notifications/notifications.service");
const blockingService = require("../users/blocking.service");

async function hydrateMentionIds(content) {
  const usernames = extractMentions(content);
  const users = await User.find({ username: { $in: usernames }, deletedAt: null }).lean();
  return users.map((user) => user.id);
}

async function notifyNewCommentMentions({ actorId, commentId, mentionUserIds = [], previousMentionUserIds = [] }) {
  const newMentionUserIds = mentionUserIds.filter((recipientId) => !previousMentionUserIds.includes(recipientId));

  if (!newMentionUserIds.length) {
    return;
  }

  await notificationService.createMentionNotifications({
    recipientIds: newMentionUserIds,
    actorId,
    entityType: "comment",
    entityId: commentId,
    message: "mentioned you in a comment"
  });
}

async function enrichComments(comments) {
  const safeComments = comments || [];
  const authorIds = [...new Set(safeComments.map((comment) => comment.authorId).filter(Boolean))];
  const profiles = await Profile.find({ userId: { $in: authorIds } }).lean();
  const avatarMediaIds = [...new Set(profiles.map((profile) => profile.avatarMediaId).filter(Boolean))];

  const [authors, mediaItems] = await Promise.all([
    User.find({ id: { $in: authorIds }, deletedAt: null }).lean(),
    avatarMediaIds.length ? Media.find({ id: { $in: avatarMediaIds }, deletedAt: null }).lean() : []
  ]);

  return safeComments.map((comment) => {
    const author = authors.find((user) => user.id === comment.authorId) || null;
    const profile = profiles.find((item) => item.userId === comment.authorId) || null;

    return {
      ...comment,
      author: author
        ? {
            ...author,
            profile: profile
              ? {
                  ...profile,
                  avatarMedia: mediaItems.find((item) => item.id === profile.avatarMediaId) || null
                }
              : null
          }
        : null
    };
  });
}

async function withCommentViewerState(comments, viewerId = null) {
  const safeComments = comments || [];
  if (!viewerId || !safeComments.length) {
    return safeComments.map((comment) => ({
      ...comment,
      viewerState: {
        liked: false
      }
    }));
  }

  const reactions = await Reaction.find({
    userId: viewerId,
    targetType: "comment",
    targetId: { $in: safeComments.map((comment) => comment.id) },
    reactionType: "like"
  }).lean();
  const reactionIds = new Set(reactions.map((reaction) => reaction.targetId));

  return safeComments.map((comment) => ({
    ...comment,
    viewerState: {
      liked: reactionIds.has(comment.id)
    }
  }));
}

async function createComment(authorId, postId, payload, parentCommentId = null) {
  const post = await Post.findOne({ id: postId, deletedAt: null });
  if (!post) {
    throw new AppError("Post not found", 404);
  }

  await blockingService.assertCanInteract(authorId, post.authorId, "You cannot reply to this post");

  let rootCommentId = null;
  let parentComment = null;
  if (parentCommentId) {
    parentComment = await Comment.findOne({ id: parentCommentId, postId, deletedAt: null }).lean();
    if (!parentComment) {
      throw new AppError("Parent comment not found", 404);
    }

    await blockingService.assertCanInteract(authorId, parentComment.authorId, "You cannot reply in this thread");
    rootCommentId = parentComment.rootCommentId || parentComment.id;
  }

  const mentionUserIds = await hydrateMentionIds(payload.content);
  const comment = await Comment.create({
    postId,
    authorId,
    parentCommentId,
    rootCommentId,
    content: payload.content,
    plainTextContent: payload.content.toLowerCase(),
    mentionUserIds
  });

  await Post.updateOne({ id: postId }, { $inc: { "stats.commentCount": 1 } });
  if (parentCommentId) {
    await Comment.updateOne({ id: parentCommentId }, { $inc: { "stats.replyCount": 1 } });
  }

  if (parentCommentId) {
    if (parentComment?.authorId && parentComment.authorId !== authorId) {
      await Notification.create({
        recipientId: parentComment.authorId,
        actorId: authorId,
        type: "reply",
        entityType: "comment",
        entityId: comment.id,
        message: "replied in your thread"
      });
    }
  } else if (post.authorId !== authorId) {
    await Notification.create({
      recipientId: post.authorId,
      actorId: authorId,
      type: "comment",
      entityType: "comment",
      entityId: comment.id,
      message: "commented on your post"
    });
  }

  await notifyNewCommentMentions({
    actorId: authorId,
    commentId: comment.id,
    mentionUserIds
  });

  return comment;
}

async function getComments(postId, viewerId = null) {
  const comments = await Comment.find({ postId, deletedAt: null }).sort({ createdAt: 1 }).lean();
  const visibleAuthorIds = await blockingService.filterVisibleAuthorIds(
    viewerId,
    comments.map((comment) => comment.authorId)
  );
  const visibleComments = comments.filter((comment) => visibleAuthorIds.includes(comment.authorId));
  const enrichedComments = await enrichComments(visibleComments);
  return withCommentViewerState(enrichedComments, viewerId);
}

async function getCommentsByAuthor(authorId, query = {}, viewerId = null) {
  const limit = Number(query.limit || 20);
  const cursor = query.cursor ? new Date(query.cursor) : null;
  const comments = await Comment.find({
    authorId,
    ...(cursor ? { createdAt: { $lt: cursor } } : {}),
    deletedAt: null,
    status: "active"
  })
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const visibleAuthorIds = await blockingService.filterVisibleAuthorIds(
    viewerId,
    comments.map((comment) => comment.authorId)
  );
  const visibleComments = comments.filter((comment) => visibleAuthorIds.includes(comment.authorId));
  const enrichedItems = await enrichComments(visibleComments);
  const commentsWithViewerState = await withCommentViewerState(enrichedItems, viewerId);
  const postIds = [...new Set(enrichedItems.map((comment) => comment.postId).filter(Boolean))];
  const posts = postIds.length
    ? await Post.find({ id: { $in: postIds }, deletedAt: null, status: "active" })
        .select("id content authorId createdAt")
        .lean()
    : [];
  const postAuthors = [...new Set(posts.map((post) => post.authorId).filter(Boolean))];
  const [postUsers, postProfiles] = await Promise.all([
    postAuthors.length ? User.find({ id: { $in: postAuthors }, deletedAt: null }).lean() : [],
    postAuthors.length ? Profile.find({ userId: { $in: postAuthors } }).lean() : []
  ]);

  const itemsWithPosts = commentsWithViewerState.map((comment) => {
    const post = posts.find((entry) => entry.id === comment.postId) || null;
    const postAuthor = post ? postUsers.find((entry) => entry.id === post.authorId) || null : null;
    const postProfile = post ? postProfiles.find((entry) => entry.userId === post.authorId) || null : null;

    return {
      ...comment,
      post: post
        ? {
            id: post.id,
            content: post.content || "",
            createdAt: post.createdAt,
            author: postAuthor
              ? {
                  id: postAuthor.id,
                  username: postAuthor.username,
                  usernameDisplay: postAuthor.usernameDisplay,
                  profile: postProfile || null
                }
              : null
          }
        : null
    };
  });

  const hasMore = itemsWithPosts.length > limit;
  const items = hasMore ? itemsWithPosts.slice(0, limit) : itemsWithPosts;

  return {
    items,
    pageInfo: {
      nextCursor: hasMore ? itemsWithPosts[limit - 1]?.createdAt || null : null,
      hasMore
    }
  };
}

async function updateComment(userId, commentId, payload) {
  const comment = await Comment.findOne({ id: commentId, authorId: userId, deletedAt: null });
  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  const previousMentionUserIds = [...(comment.mentionUserIds || [])];
  comment.content = payload.content;
  comment.plainTextContent = payload.content.toLowerCase();
  comment.mentionUserIds = await hydrateMentionIds(payload.content);
  comment.isEdited = true;
  comment.editedAt = new Date();
  comment.modifiedAt = new Date();
  await comment.save();
  await notifyNewCommentMentions({
    actorId: userId,
    commentId: comment.id,
    mentionUserIds: comment.mentionUserIds,
    previousMentionUserIds
  });

  return comment;
}

async function deleteComment(userId, commentId) {
  await Comment.findOneAndUpdate(
    { id: commentId, authorId: userId, deletedAt: null },
    { deletedAt: new Date(), status: "removed", modifiedAt: new Date() },
    { new: true }
  );

  return { success: true };
}

async function toggleCommentReaction(userId, commentId, shouldReact) {
  const comment = await Comment.findOne({ id: commentId, deletedAt: null });
  if (!comment) {
    throw new AppError("Comment not found", 404);
  }

  await blockingService.assertCanInteract(userId, comment.authorId, "You cannot react to this comment");

  if (shouldReact) {
    const existing = await Reaction.findOne({
      userId,
      targetType: "comment",
      targetId: commentId,
      reactionType: "like"
    });

    if (!existing) {
      await Reaction.create({
        userId,
        targetType: "comment",
        targetId: commentId,
        reactionType: "like"
      });
      await Comment.updateOne({ id: commentId }, { $inc: { "stats.likeCount": 1 } });
      if (comment.authorId !== userId) {
        await Notification.create({
          recipientId: comment.authorId,
          actorId: userId,
          type: "like_comment",
          entityType: "comment",
          entityId: commentId,
          message: "liked your comment"
        });
      }
    }
  } else {
    const existing = await Reaction.findOne({
      userId,
      targetType: "comment",
      targetId: commentId,
      reactionType: "like"
    });

    if (existing) {
      await Reaction.deleteOne({ userId, targetType: "comment", targetId: commentId, reactionType: "like" });
      await Comment.updateOne({ id: commentId }, { $inc: { "stats.likeCount": -1 } });
    }
  }

  return { success: true };
}

module.exports = {
  createComment,
  getComments,
  getCommentsByAuthor,
  updateComment,
  deleteComment,
  toggleCommentReaction,
  enrichComments
};
