const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const postsService = require("./posts.service");

const create = asyncHandler(async (req, res) => {
  const result = await postsService.createPost(req.user.id, req.body);
  return sendSuccess(res, { statusCode: 201, message: "Post created", data: result });
});

const feed = asyncHandler(async (req, res) => {
  const result = await postsService.getFeed(req.user?.id || null, req.query);
  return sendSuccess(res, { message: "Feed loaded", data: result.items, meta: result.pageInfo });
});

const explore = asyncHandler(async (req, res) => {
  const result = await postsService.getExplore(req.query, req.user?.id || null);
  return sendSuccess(res, { message: "Explore loaded", data: result.items, meta: result.pageInfo });
});

const getOne = asyncHandler(async (req, res) => {
  const result = await postsService.getPost(req.params.postId, req.user?.id || null);
  return sendSuccess(res, { message: "Post loaded", data: result });
});

const update = asyncHandler(async (req, res) => {
  const result = await postsService.updatePost(req.user.id, req.params.postId, req.body);
  return sendSuccess(res, { message: "Post updated", data: result });
});

const remove = asyncHandler(async (req, res) => {
  const result = await postsService.deletePost(req.user.id, req.params.postId);
  return sendSuccess(res, { message: "Post removed", data: result });
});

const repost = asyncHandler(async (req, res) => {
  const result = await postsService.repostPost(req.user.id, req.params.postId, req.body);
  return sendSuccess(res, { statusCode: 201, message: "Post reposted", data: result });
});
const removeRepost = asyncHandler(async (req, res) => {
  const result = await postsService.deleteRepost(req.user.id, req.params.postId);
  return sendSuccess(res, { statusCode: 200, message: "Post repost removed", data: result });
});

const bookmark = asyncHandler(async (req, res) => {
  const result = await postsService.toggleBookmark(req.user.id, req.params.postId, true);
  return sendSuccess(res, { message: "Post bookmarked", data: result });
});

const unbookmark = asyncHandler(async (req, res) => {
  const result = await postsService.toggleBookmark(req.user.id, req.params.postId, false);
  return sendSuccess(res, { message: "Bookmark removed", data: result });
});

const react = asyncHandler(async (req, res) => {
  const result = await postsService.toggleReaction(req.user.id, req.params.postId, true);
  return sendSuccess(res, { message: "Reaction added", data: result });
});

const unreact = asyncHandler(async (req, res) => {
  const result = await postsService.toggleReaction(req.user.id, req.params.postId, false);
  return sendSuccess(res, { message: "Reaction removed", data: result });
});

module.exports = {
  create,
  feed,
  explore,
  getOne,
  update,
  remove,
  repost,
  bookmark,
  unbookmark,
  removeRepost,
  react,
  unreact
};
