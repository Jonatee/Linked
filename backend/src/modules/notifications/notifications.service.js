const Notification = require("./notification.model");
const User = require("../users/user.model");
const Profile = require("../profiles/profile.model");
const Comment = require("../comments/comment.model");
const Media = require("../media/media.model");
const { sendToUser } = require("../../utils/fcm");

async function createNotification({ recipientId, actorId = null, type, entityType = "", entityId = "", message = "" }) {
  const notification = await Notification.create({ recipientId, actorId, type, entityType, entityId, message });

  // Get actor info for dynamic notification title and navigation data
  let notificationTitle = "New notification";
  let notificationBody = message || type;
  let navigationData = { type, entityType, entityId: entityId || "" };
  
  if (actorId) {
    try {
      const actor = await User.findOne({ id: actorId, deletedAt: null }).lean();
      const profile = await Profile.findOne({ userId: actorId }).lean();
      
      if (actor) {
        const displayName = profile?.displayName || actor.usernameDisplay || actor.username;
        
        switch (type) {
          case "like":
            notificationTitle = `${displayName} liked your post`;
            break;
          case "comment":
            notificationTitle = `${displayName} commented on your post`;
            break;
          case "follow":
            notificationTitle = `${displayName} started following you`;
            break;
          case "mention":
            notificationTitle = `${displayName} mentioned you`;
            break;
          default:
            notificationTitle = `${displayName} - ${type}`;
        }
        
        // Add actor info to navigation data
        navigationData.actorId = actorId;
        navigationData.actorUsername = actor.username;
      }
    } catch (error) {
      // Fallback to default title if user lookup fails
      console.error('Failed to get actor info for notification:', error);
    }
  }

  // Determine navigation route based on notification type and entity
  let webUrl = "/notifications"; // default fallback

  if (entityType === "post" && entityId) {
    webUrl = `/posts/${entityId}`;
  } else if (entityType === "comment" && entityId) {
    // For comments, we need to get the post ID to navigate to the post
    try {
      const comment = await Comment.findOne({ id: entityId, deletedAt: null }).lean();
      if (comment?.postId) {
        webUrl = `/posts/${comment.postId}`;
      }
    } catch (error) {
      console.error('Failed to get comment info for navigation:', error);
    }
  } else if (entityType === "user" && navigationData.actorUsername) {
    webUrl = `/profile/${navigationData.actorUsername}`;
  } else if (type === "follow" && navigationData.actorUsername) {
    webUrl = `/profile/${navigationData.actorUsername}`;
  }

  // Add navigation info to FCM data
  navigationData.webUrl = webUrl;
  navigationData.fullUrl = `${process.env.FRONTEND_ORIGIN || 'https://linked-theta.vercel.app'}${webUrl}`;

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
