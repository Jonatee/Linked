const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const searchService = require("./search.service");

const users = asyncHandler(async (req, res) => {
  const result = await searchService.searchUsers(req.query.q || "");
  return sendSuccess(res, { message: "User search complete", data: result });
});

const posts = asyncHandler(async (req, res) => {
  const result = await searchService.searchPosts(req.query.q || "", req.user?.id || null);
  return sendSuccess(res, { message: "Post search complete", data: result });
});

const tags = asyncHandler(async (req, res) => {
  const result = await searchService.searchTags(req.query.q || "");
  return sendSuccess(res, { message: "Tag search complete", data: result });
});

module.exports = {
  users,
  posts,
  tags
};
