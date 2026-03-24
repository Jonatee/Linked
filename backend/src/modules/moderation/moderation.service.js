const Report = require("./report.model");
const ModerationAction = require("./moderation-action.model");
const Post = require("../posts/post.model");
const Comment = require("../comments/comment.model");
const User = require("../users/user.model");

async function createReport(reporterId, payload) {
  return Report.create({
    reporterId,
    ...payload
  });
}

async function listReports() {
  return Report.find({}).sort({ createdAt: -1 }).lean();
}

async function updateReport(id, moderatorId, payload) {
  return Report.findOneAndUpdate(
    { id },
    {
      ...payload,
      moderatorId,
      resolvedAt: payload.status === "resolved" ? new Date() : null,
      modifiedAt: new Date()
    },
    { new: true }
  );
}

async function createAction(actorId, payload) {
  if (payload.targetType === "post") {
    await Post.updateOne({ id: payload.targetId }, { status: "hidden", moderationStatus: "pending" });
  }

  if (payload.targetType === "comment") {
    await Comment.updateOne({ id: payload.targetId }, { status: "hidden", moderationStatus: "pending" });
  }

  if (payload.targetType === "user" && ["suspend", "ban", "restore"].includes(payload.actionType)) {
    const nextStatus =
      payload.actionType === "restore"
        ? "active"
        : payload.actionType === "ban"
          ? "banned"
          : "suspended";

    await User.updateOne({ id: payload.targetId }, { status: nextStatus, modifiedAt: new Date() });
  }

  return ModerationAction.create({
    actorId,
    ...payload
  });
}

module.exports = {
  createReport,
  listReports,
  updateReport,
  createAction
};

