"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import FeedCard from "@/components/feed/feed-card";
import CommentThread from "@/components/comments/comment-thread";
import CommentComposer from "@/components/comments/comment-composer";
import { formatPost } from "@/lib/formatters";
import { PostDetailSkeleton } from "@/components/loading/screen-skeletons";

export default function PostDetailData({ postId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const [postResponse, commentsResponse] = await Promise.all([
        api.get(`/posts/${postId}`),
        api.get(`/posts/${postId}/comments`)
      ]);

      return {
        post: postResponse.data.data,
        comments: commentsResponse.data.data
      };
    }
  });

  if (isLoading) {
    return <PostDetailSkeleton />;
  }

  if (error || !data) {
    return <div className="panel p-6 text-sm text-accent">Failed to load post.</div>;
  }

  return (
    <>
      <FeedCard post={formatPost(data.post)} />
      <CommentComposer postId={postId} />
      <CommentThread
        comments={(data.comments || []).map((comment) => ({
          id: comment.id,
          postId: comment.postId,
          parentCommentId: comment.parentCommentId || null,
          rootCommentId: comment.rootCommentId || null,
          author: {
            name:
              comment.author?.profile?.displayName ||
              comment.author?.usernameDisplay ||
              comment.author?.username ||
              "Unknown",
            username: comment.author?.username || "",
            avatarUrl: comment.author?.profile?.avatarMedia?.secureUrl || "",
            initials: (
              comment.author?.profile?.displayName ||
              comment.author?.usernameDisplay ||
              comment.author?.username ||
              "UN"
            )
              .slice(0, 2)
              .toUpperCase()
          },
          content: comment.content
        }))}
      />
    </>
  );
}
