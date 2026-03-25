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

async function createComment(authorId, postId, payload, parentCommentId = null) {
  const post = await Post.findOne({ id: postId, deletedAt: null });
  if (!post) {
    throw new AppError("Post not found", 404);
  }

  await blockingService.assertCanInteract(authorId, post.authorId, "You cannot reply to this post");

  let rootCommentId = null;
  if (parentCommentId) {
    const parentComment = await Comment.findOne({ id: parentCommentId, postId, deletedAt: null }).lean();
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

  await Notification.create({
    recipientId: post.authorId,
    actorId: authorId,
    type: parentCommentId ? "reply" : "comment",
    entityType: "comment",
    entityId: comment.id,
    message: parentCommentId ? "replied in your thread" : "commented on your post"
  });
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
  return enrichComments(visibleComments);
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
  updateComment,
  deleteComment,
  toggleCommentReaction,
  enrichComments
};
