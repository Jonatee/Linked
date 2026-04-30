const Notification = require("./notification.model");
const User = require("../users/user.model");
const Profile = require("../profiles/profile.model");
const Comment = require("../comments/comment.model");
const Media = require("../media/media.model");
const { sendToUser } = require("../../utils/fcm");

function normalizeNotificationType(type = "") {
  if (type === "like_post" || type === "like_comment") {
    return "like";
  }

  return type;
}

function shouldDeduplicateNotification({ type, actorId, entityType, entityId }) {
  if (!actorId || !entityType || !entityId) {
    return false;
  }

  return ["follow", "like_post", "like_comment", "repost"].includes(type);
}

function buildNotificationTitle({ type, entityType, displayName }) {
  const normalizedType = normalizeNotificationType(type);

  switch (normalizedType) {
    case "like":
      return `${displayName} liked your ${entityType === "comment" ? "comment" : "post"}`;
    case "comment":
      return `${displayName} commented on your post`;
    case "reply":
      return `${displayName} replied in your thread`;
    case "follow":
      return `${displayName} started following you`;
    case "mention":
      return `${displayName} mentioned you`;
    case "repost":
      return `${displayName} reposted your post`;
    case "new_post":
      return `${displayName} made a new post`;
    default:
      return `${displayName} sent you a notification`;
  }
}

async function createNotification({ recipientId, actorId = null, type, entityType = "", entityId = "", message = "" }) {
  const shouldDeduplicate = shouldDeduplicateNotification({ type, actorId, entityType, entityId });

  if (shouldDeduplicate) {
    const existingNotification = await Notification.findOne({ recipientId, actorId, type, entityType, entityId }).lean();
    if (existingNotification) {
      return existingNotification;
    }
  }

  const notification = await Notification.create({ recipientId, actorId, type, entityType, entityId, message });

  const normalizedType = normalizeNotificationType(type);
  let notificationTitle = "New notification";
  let notificationBody = message || normalizedType;
  let navigationData = {
    type: normalizedType,
    rawType: type,
    entityType,
    entityId: entityId || ""
  };

  if (actorId) {
    try {
      const actor = await User.findOne({ id: actorId, deletedAt: null }).lean();
      const profile = await Profile.findOne({ userId: actorId }).lean();

      if (actor) {
        const displayName = profile?.displayName || actor.usernameDisplay || actor.username;
        notificationTitle = buildNotificationTitle({
          type,
          entityType,
          displayName
        });

        navigationData.actorId = actorId;
        navigationData.actorUsername = actor.username;
      }
    } catch (error) {
      console.error("Failed to get actor info for notification:", error);
    }
  }

  let webUrl = "/notifications";

  if (entityType === "post" && entityId) {
    webUrl = `/posts/${entityId}`;
  } else if (entityType === "comment" && entityId) {
    try {
      const comment = await Comment.findOne({ id: entityId, deletedAt: null }).lean();
      if (comment?.postId) {
        webUrl = `/posts/${comment.postId}`;
      }
    } catch (error) {
      console.error("Failed to get comment info for navigation:", error);
    }
  } else if (entityType === "user" && navigationData.actorUsername) {
    webUrl = `/profile/${navigationData.actorUsername}`;
  } else if (normalizedType === "follow" && navigationData.actorUsername) {
    webUrl = `/profile/${navigationData.actorUsername}`;
  }

  navigationData.webUrl = webUrl;
  navigationData.fullUrl = `${process.env.FRONTEND_ORIGIN || "https://linked-theta.vercel.app"}${webUrl}`;

  sendToUser(recipientId, {
    title: notificationTitle,
    body: notificationBody,
    data: navigationData
  }).catch(() => {});

  return notification;
}

async function createMentionNotifications({ recipientIds = [], actorId, entityType, entityId, message }) {
  const targetRecipientIds = [...new Set(recipientIds.filter((recipientId) => recipientId && recipientId !== actorId))];

  if (!targetRecipientIds.length) {
    return [];
  }

  return Promise.all(
    targetRecipientIds.map((recipientId) =>
      createNotification({ recipientId, actorId, type: "mention", entityType, entityId, message })
    )
  );
}

async function listNotifications(recipientId) {
  const notifications = await Notification.find({ recipientId }).sort({ createdAt: -1 }).limit(100).lean();
  const actorIds = [...new Set(notifications.map((item) => item.actorId).filter(Boolean))];

  const [actors, profiles, comments] = await Promise.all([
    User.find({ id: { $in: actorIds }, deletedAt: null }).lean(),
    Profile.find({ userId: { $in: actorIds } }).lean(),
    Comment.find({
      id: { $in: notifications.filter((item) => item.entityType === "comment").map((item) => item.entityId) },
      deletedAt: null
    }).lean()
  ]);

  const avatarMediaIds = [...new Set(profiles.map((profile) => profile.avatarMediaId).filter(Boolean))];
  const mediaItems = avatarMediaIds.length ? await Media.find({ id: { $in: avatarMediaIds }, deletedAt: null }).lean() : [];

  return notifications.map((item) => {
    const actor = actors.find((user) => user.id === item.actorId) || null;
    const profile = profiles.find((entry) => entry.userId === item.actorId) || null;
    const comment = comments.find((entry) => entry.id === item.entityId) || null;
    const normalizedType = normalizeNotificationType(item.type);

    let targetUrl = "/notifications";
    if (item.entityType === "post" && item.entityId) {
      targetUrl = `/posts/${item.entityId}`;
    } else if (item.entityType === "comment" && comment?.postId) {
      targetUrl = `/posts/${comment.postId}`;
    } else if (item.entityType === "user" && actor?.username) {
      targetUrl = `/profile/${actor.username}`;
    }

    return {
      ...item,
      type: normalizedType,
      rawType: item.type,
      actor: actor
        ? {
            id: actor.id,
            username: actor.username,
            usernameDisplay: actor.usernameDisplay,
            profile: profile
              ? {
                  ...profile,
                  avatarMedia: mediaItems.find((media) => media.id === profile.avatarMediaId) || null
                }
              : null
          }
        : null,
      targetUrl
    };
  });
}

async function markRead(recipientId, id) {
  return Notification.findOneAndUpdate(
    { recipientId, id },
    { isRead: true, readAt: new Date(), modifiedAt: new Date() },
    { new: true }
  );
}

async function markAllRead(recipientId) {
  await Notification.updateMany(
    { recipientId, isRead: false },
    { isRead: true, readAt: new Date(), modifiedAt: new Date() }
  );
  return { success: true };
}

module.exports = {
  createNotification,
  createMentionNotifications,
  listNotifications,
  markRead,
  markAllRead
};
