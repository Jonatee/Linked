const User = require("../users/user.model");
const Post = require("../posts/post.model");
const Comment = require("../comments/comment.model");
const ModerationAction = require("../moderation/moderation-action.model");

async function listUsers({ page = 1, limit = 20, q = "" }) {
  const skip = (Number(page) - 1) * Number(limit);
  const filter = q
    ? {
        $or: [
          { username: new RegExp(q, "i") },
          { email: new RegExp(q, "i") },
          { usernameDisplay: new RegExp(q, "i") }
        ]
      }
    : {};

  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(filter)
  ]);

  return {
    items,
    total,
    page: Number(page),
    limit: Number(limit)
  };
}

async function updateUserStatus(id, status) {
  return User.findOneAndUpdate({ id }, { status, modifiedAt: new Date() }, { new: true });
}

async function getStats() {
  const [users, posts, comments, auditLogs] = await Promise.all([
    User.countDocuments({}),
    Post.countDocuments({ deletedAt: null }),
    Comment.countDocuments({ deletedAt: null }),
    ModerationAction.countDocuments({})
  ]);

  return { users, posts, comments, auditLogs };
}

async function getAuditLogs() {
  return ModerationAction.find({}).sort({ createdAt: -1 }).limit(100).lean();
}

module.exports = {
  listUsers,
  updateUserStatus,
  getStats,
  getAuditLogs
};

