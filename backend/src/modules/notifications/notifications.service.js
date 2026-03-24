const Notification = require("./notification.model");
const User = require("../users/user.model");
const Profile = require("../profiles/profile.model");
const Comment = require("../comments/comment.model");
const Media = require("../media/media.model");

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
  listNotifications,
  markRead,
  markAllRead
};
