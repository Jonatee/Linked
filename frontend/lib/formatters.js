export function formatPost(post) {
  const relationship = post.viewerState?.relationship || {};
  const original = post.originalPost || null;
  const engagementSource = (post.type === "repost" || post.type === "quote_repost") && original ? original : post;

  return {
    id: post.id,
    actionPostId: engagementSource.id || post.id,
    type: post.type || "text",
    author: {
      id: post.author?.id || post.authorId || "",
      name: post.author?.profile?.displayName || post.author?.usernameDisplay || "Unknown",
      username: post.author?.username || "unknown",
      initials: (post.author?.usernameDisplay || post.author?.username || "LI").slice(0, 2).toUpperCase(),
      avatarUrl: post.author?.profile?.avatarMedia?.secureUrl || ""
    },
    content: post.content || post.quoteText || "",
    createdAtLabel: post.createdAt ? new Date(post.createdAt).toLocaleString() : "now",
    media: (post.media || []).map((item) => ({
      id: item.id,
      type: item.type,
      url: item.secureUrl,
      alt: item.altText
    })),
    originalPost: original
      ? {
          id: original.id,
          author: {
            id: original.author?.id || original.authorId || "",
            name: original.author?.profile?.displayName || original.author?.usernameDisplay || "Unknown",
            username: original.author?.username || "unknown",
            initials: (original.author?.usernameDisplay || original.author?.username || "LI").slice(0, 2).toUpperCase(),
            avatarUrl: original.author?.profile?.avatarMedia?.secureUrl || ""
          },
          content: original.content || original.quoteText || "",
          media: (original.media || []).map((item) => ({
            id: item.id,
            type: item.type,
            url: item.secureUrl,
            alt: item.altText
          })),
          stats: {
            likeCount: original.stats?.likeCount || 0,
            commentCount: original.stats?.commentCount || 0,
            repostCount: original.stats?.repostCount || 0,
            bookmarkCount: original.stats?.bookmarkCount || 0
          },
          viewerState: {
            liked: Boolean(original.viewerState?.liked),
            bookmarked: Boolean(original.viewerState?.bookmarked),
            reposted: Boolean(original.viewerState?.reposted)
          }
        }
      : null,
    quotePost: original || null,
    viewerState: {
      liked: Boolean(engagementSource.viewerState?.liked),
      bookmarked: Boolean(engagementSource.viewerState?.bookmarked),
      reposted: Boolean(engagementSource.viewerState?.reposted),
      isOwner: Boolean(relationship.isSelf),
      followingAuthor: Boolean(relationship.following),
      blockedByViewer: Boolean(relationship.blockedByViewer),
      hasBlockedViewer: Boolean(relationship.hasBlockedViewer),
      canInteract:
        relationship.canInteract === undefined ? true : Boolean(relationship.canInteract)
    },
    stats: {
      likeCount: engagementSource.stats?.likeCount || 0,
      commentCount: engagementSource.stats?.commentCount || 0,
      repostCount: engagementSource.stats?.repostCount || 0,
      bookmarkCount: engagementSource.stats?.bookmarkCount || 0
    }
  };
}
