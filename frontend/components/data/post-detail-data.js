"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp } from "lucide-react";
import api from "@/lib/api";
import FeedCard from "@/components/feed/feed-card";
import CommentThread from "@/components/comments/comment-thread";
import CommentComposer from "@/components/comments/comment-composer";
import { formatPost } from "@/lib/formatters";
import { PostDetailSkeleton } from "@/components/loading/screen-skeletons";

function formatCommentTime(value) {
  if (!value) {
    return "";
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "";
  }

  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    return `${Math.max(1, Math.floor(diffMs / minute))}m`;
  }

  if (diffMs < day) {
    return `${Math.floor(diffMs / hour)}h`;
  }

  return `${Math.floor(diffMs / day)}d`;
}

function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 320);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-28 right-4 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-[#151515]/95 px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#1c1c1c] lg:right-[344px]"
    >
      <ArrowUp size={16} />
      <span>Top</span>
    </button>
  );
}

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

  const commentItems = (data.comments || []).map((comment) => ({
    id: comment.id,
    postId: comment.postId,
    authorId: comment.author?.id || comment.authorId || null,
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
    content: comment.content,
    createdAtLabel: formatCommentTime(comment.createdAt),
    stats: {
      likeCount: comment.stats?.likeCount || 0,
      replyCount: comment.stats?.replyCount || 0
    },
    viewerState: {
      liked: Boolean(comment.viewerState?.liked)
    }
  }));

  return (
    <div className="space-y-4 pb-32">
      <FeedCard post={formatPost(data.post)} truncateContent={false} navigateOnCard={false} />
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="editorial-title text-sm font-bold uppercase tracking-[0.2em] text-muted">Comments</h2>
          <span className="text-xs text-[#8d8782]">{commentItems.length}</span>
        </div>
        <CommentComposer postId={postId} />
        <CommentThread comments={commentItems} />
      </section>
      <BackToTopButton />
    </div>
  );
}

