const Report = require("./report.model");
const ModerationAction = require("./moderation-action.model");
const Post = require("../posts/post.model");
const Comment = require("../comments/comment.model");
const User = require("../users/user.model");

async function createReport(reporterId, payload) {
  const existing = await Report.findOne({
    reporterId,
    targetType: payload.targetType,
    targetId: payload.targetId,
    deletedAt: null
  }).lean();

  if (existing) {
    return {
      ...existing,
      alreadyReported: true
    };
  }

  const report = await Report.create({
    reporterId,
    ...payload
  });

  return {
    ...report.toObject(),
    alreadyReported: false
  };
}

async function listReports() {
  const reports = await Report.find({}).sort({ createdAt: -1 }).lean();
  const postIds = [...new Set(reports.filter((report) => report.targetType === "post").map((report) => report.targetId))];
  const commentIds = [...new Set(reports.filter((report) => report.targetType === "comment").map((report) => report.targetId))];
  const userIds = [...new Set(reports.filter((report) => report.targetType === "user").map((report) => report.targetId))];

  const [posts, comments, users] = await Promise.all([
    postIds.length ? Post.find({ id: { $in: postIds } }).lean() : [],
    commentIds.length ? Comment.find({ id: { $in: commentIds } }).lean() : [],
    userIds.length ? User.find({ id: { $in: userIds } }).lean() : []
  ]);

  const postMap = new Map(posts.map((post) => [post.id, post]));
  const commentMap = new Map(comments.map((comment) => [comment.id, comment]));
  const userMap = new Map(users.map((user) => [user.id, user]));

  return reports.map((report) => {
    if (report.targetType === "post") {
      const target = postMap.get(report.targetId);
      return {
        ...report,
        target: target
          ? {
              id: target.id,
              type: "post",
              content: target.content || "",
              authorId: target.authorId || null,
              status: target.status || "active"
            }
          : null
      };
    }

    if (report.targetType === "comment") {
      const target = commentMap.get(report.targetId);
      return {
        ...report,
        target: target
          ? {
              id: target.id,
              type: "comment",
              content: target.content || "",
              authorId: target.authorId || null,
              postId: target.postId || null,
              status: target.status || "active"
            }
          : null
      };
    }

    if (report.targetType === "user") {
      const target = userMap.get(report.targetId);
      return {
        ...report,
        target: target
          ? {
              id: target.id,
              type: "user",
              username: target.username,
              usernameDisplay: target.usernameDisplay,
              status: target.status || "active"
            }
          : null
      };
    }

    return report;
  });
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
