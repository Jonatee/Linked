const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const followsService = require("./follows.service");

const follow = asyncHandler(async (req, res) => {
  const result = await followsService.followUser(req.user.id, req.params.userId);
  return sendSuccess(res, { statusCode: 201, message: "Followed user", data: result });
});

const unfollow = asyncHandler(async (req, res) => {
  const result = await followsService.unfollowUser(req.user.id, req.params.userId);
  return sendSuccess(res, { message: "Unfollowed user", data: result });
});

const enablePostNotifications = asyncHandler(async (req, res) => {
  const result = await followsService.enablePostNotifications(req.user.id, req.params.userId);
  return sendSuccess(res, { message: "Post notifications enabled", data: result });
});

const disablePostNotifications = asyncHandler(async (req, res) => {
  const result = await followsService.disablePostNotifications(req.user.id, req.params.userId);
  return sendSuccess(res, { message: "Post notifications disabled", data: result });
});

module.exports = {
  follow,
  unfollow,
  enablePostNotifications,
  disablePostNotifications
};

