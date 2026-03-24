function createCursorPagination({ items, limit, cursorField = "createdAt" }) {
  const hasMore = items.length > limit;
  const safeItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? safeItems[safeItems.length - 1][cursorField] : null;

  return {
    items: safeItems,
    pageInfo: {
      nextCursor,
      hasMore
    }
  };
}

module.exports = {
  createCursorPagination
};

