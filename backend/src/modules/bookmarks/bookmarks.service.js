const Bookmark = require("./bookmark.model");
const Post = require("../posts/post.model");
const postsService = require("../posts/posts.service");

async function listBookmarks(userId, query = {}) {
  const limit = Number(query.limit || 20);
  const cursor = query.cursor ? new Date(query.cursor) : null;
  const bookmarks = await Bookmark.find({
    userId,
    ...(cursor ? { createdAt: { $lt: cursor } } : {})
  })
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const postIds = bookmarks.map((bookmark) => bookmark.postId);
  const posts = await Post.find({ id: { $in: postIds }, deletedAt: null, status: "active" }).lean();
  const orderMap = new Map(bookmarks.map((bookmark, index) => [bookmark.postId, index]));
  const orderedPosts = posts.sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));
  const enrichedItems = await postsService.enrichPosts(orderedPosts, userId);

  const hasMore = enrichedItems.length > limit;
  const items = hasMore ? enrichedItems.slice(0, limit) : enrichedItems;

  return {
    items,
    pageInfo: {
      nextCursor: hasMore ? bookmarks[limit - 1]?.createdAt || null : null,
      hasMore
    }
  };
}

module.exports = {
  listBookmarks
};
