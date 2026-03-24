const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const commentsService = require("./comments.service");

const create = asyncHandler(async (req, res) => {
  const result = await commentsService.createComment(req.user.id, req.params.postId, req.body);
  return sendSuccess(res, { statusCode: 201, message: "Comment created", data: result });
});

const list = asyncHandler(async (req, res) => {
  const result = await commentsService.getComments(req.params.postId, req.user?.id || null);
  return sendSuccess(res, { message: "Comments loaded", data: result });
});

const update = asyncHandler(async (req, res) => {
  const result = await commentsService.updateComment(req.user.id, req.params.commentId, req.body);
  return sendSuccess(res, { message: "Comment updated", data: result });
});

const remove = asyncHandler(async (req, res) => {
  const result = await commentsService.deleteComment(req.user.id, req.params.commentId);
  return sendSuccess(res, { message: "Comment removed", data: result });
});

const react = asyncHandler(async (req, res) => {
  const result = await commentsService.toggleCommentReaction(req.user.id, req.params.commentId, true);
  return sendSuccess(res, { message: "Reaction added", data: result });
});

const unreact = asyncHandler(async (req, res) => {
  const result = await commentsService.toggleCommentReaction(req.user.id, req.params.commentId, false);
  return sendSuccess(res, { message: "Reaction removed", data: result });
});

const reply = asyncHandler(async (req, res) => {
  const result = await commentsService.createComment(
    req.user.id,
    req.body.postId || req.query.postId,
    req.body,
    req.params.commentId
  );
  return sendSuccess(res, { statusCode: 201, message: "Reply created", data: result });
});

module.exports = {
  create,
  list,
  update,
  remove,
  react,
  unreact,
  reply
};
