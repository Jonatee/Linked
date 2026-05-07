export function getActiveConversationId(pathname) {
  if (!pathname) {
    return null;
  }

  const match = pathname.match(/^\/messages\/([^/?#]+)/);
  return match?.[1] || null;
}

export function getUnreadConversationCount(conversations = [], activeConversationId = null) {
  return conversations.reduce((count, conversation) => {
    if (!conversation || conversation.id === activeConversationId) {
      return count;
    }

    return count + Number(conversation.unreadCount || 0);
  }, 0);
}