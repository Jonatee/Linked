const asyncHandler = require("../../utils/async-handler");
const { sendSuccess } = require("../../utils/response");
const bookmarksService = require("./bookmarks.service");

const list = asyncHandler(async (req, res) => {
  const result = await bookmarksService.listBookmarks(req.user.id, req.query);
  return sendSuccess(res, { message: "Bookmarks loaded", data: result.items, meta: result.pageInfo });
});

module.exports = {
  list
};

