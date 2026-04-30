const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const usersService = require("./users.service");

const getByUsername = asyncHandler(async (req, res) => {
  const result = await usersService.getUserByUsername(req.params.username, req.user?.id || null);
  return sendSuccess(res, { message: "User loaded", data: result });
});

const updateProfile = asyncHandler(async (req, res) => {
  const result = await usersService.updateProfile(req.user.id, req.body);
  return sendSuccess(res, { message: "Profile updated", data: result });
});

const updateSettings = asyncHandler(async (req, res) => {
  const result = await usersService.updateSettings(req.user.id, req.body);
  return sendSuccess(res, { message: "Settings updated", data: result });
});

const followers = asyncHandler(async (req, res) => {
  const result = await usersService.listFollowers(req.params.username, req.query);
  return sendSuccess(res, { message: "Followers loaded", data: result.items, meta: result.pageInfo });
});

const following = asyncHandler(async (req, res) => {
  const result = await usersService.listFollowing(req.params.username, req.query);
  return sendSuccess(res, { message: "Following loaded", data: result.items, meta: result.pageInfo });
});

const posts = asyncHandler(async (req, res) => {
  const result = await usersService.listUserPosts(req.params.username, req.query, req.user?.id || null);
  return sendSuccess(res, { message: "User posts loaded", data: result.items, meta: result.pageInfo });
});

const comments = asyncHandler(async (req, res) => {
  const result = await usersService.listUserComments(req.params.username, req.query, req.user?.id || null);
  return sendSuccess(res, { message: "User comments loaded", data: result.items, meta: result.pageInfo });
});

const likes = asyncHandler(async (req, res) => {
  const result = await usersService.listUserLikes(req.params.username, req.query, req.user?.id || null);
  return sendSuccess(res, { message: "User likes loaded", data: result.items, meta: result.pageInfo });
});

const block = asyncHandler(async (req, res) => {
  const result = await usersService.blockUser(req.user.id, req.params.userId);
  return sendSuccess(res, { message: "User blocked", data: result });
});

const unblock = asyncHandler(async (req, res) => {
  const result = await usersService.unblockUser(req.user.id, req.params.userId);
  return sendSuccess(res, { message: "User unblocked", data: result });
});

module.exports = {
  getByUsername,
  updateProfile,
  updateSettings,
  followers,
  following,
  posts,
  comments,
  likes,
  block,
  unblock
};
