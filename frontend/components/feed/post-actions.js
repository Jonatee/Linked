"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import useAuthStore from "@/stores/auth-store";

function ActionControl({ icon: Icon, count, active, onClick, disabled = false, href, ariaLabel }) {
  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className="inline-flex items-center gap-2 text-xs text-muted transition hover:text-white">
        <span className="action-pop inline-flex items-center gap-2">
          <Icon size={16} fill={active ? "currentColor" : "none"} />
          {typeof count === "number" ? <span>{count}</span> : null}
        </span>
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`action-pop gap-2 px-0 py-0 text-xs ${active ? "text-accent" : "text-muted"}`}
    >
      <Icon size={16} fill={active ? "currentColor" : "none"} />
      {typeof count === "number" ? <span>{count}</span> : null}
    </Button>
  );
}

export default function PostActions({ post }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.currentUser);
  const targetPostId = post.actionPostId || post.id;
  const canInteract = post.viewerState?.canInteract ?? post.viewerState?.relationship?.canInteract ?? true;
  const [liked, setLiked] = useState(Boolean(post.viewerState?.liked));
  const [bookmarked, setBookmarked] = useState(Boolean(post.viewerState?.bookmarked));
  const [reposted, setReposted] = useState(Boolean(post.viewerState?.reposted));
  const [counts, setCounts] = useState({
    likeCount: post.stats.likeCount || 0,
    bookmarkCount: post.stats.bookmarkCount || 0,
    repostCount: post.stats.repostCount || 0,
    commentCount: post.stats.commentCount || 0
  });

  useEffect(() => {
    setLiked(Boolean(post.viewerState?.liked));
    setBookmarked(Boolean(post.viewerState?.bookmarked));
    setReposted(Boolean(post.viewerState?.reposted));
    setCounts({
      likeCount: post.stats.likeCount || 0,
      bookmarkCount: post.stats.bookmarkCount || 0,
      repostCount: post.stats.repostCount || 0,
      commentCount: post.stats.commentCount || 0
    });
  }, [post]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["feed"] });
    queryClient.invalidateQueries({ queryKey: ["explore"] });
    queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    queryClient.invalidateQueries({ queryKey: ["post", post.id] });
    queryClient.invalidateQueries({ queryKey: ["post", targetPostId] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["profile-posts"] });
  };

  const likeMutation = useMutation({
    mutationFn: async (nextLiked) => {
      if (nextLiked) {
        await api.post(`/posts/${targetPostId}/react`);
      } else {
        await api.delete(`/posts/${targetPostId}/react`);
      }
    },
    onSuccess: invalidateAll
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (nextBookmarked) => {
      if (nextBookmarked) {
        await api.post(`/posts/${targetPostId}/bookmark`);
      } else {
        await api.delete(`/posts/${targetPostId}/bookmark`);
      }
    },
    onSuccess: invalidateAll
  });

  const repostMutation = useMutation({
    mutationFn: async (nextReposted) => {
      if (nextReposted) {
        await api.post(`/posts/${targetPostId}/repost`, { type: "repost", quoteText: "" });
      }
    },
    onSuccess: invalidateAll
  });
  
  const removeRepostMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/posts/${targetPostId}/repost`);
    },
    onSuccess: invalidateAll
  });

  const actionsDisabled = useMemo(
    () => !canInteract || likeMutation.isPending || bookmarkMutation.isPending || repostMutation.isPending || removeRepostMutation.isPending,
    [bookmarkMutation.isPending, canInteract, likeMutation.isPending, repostMutation.isPending, removeRepostMutation.isPending]
  );

  function requireLogin() {
    router.push(getLoginRedirectPath(pathname || `/posts/${targetPostId}`));
  }

  function handleLike() {
    if (!currentUser) {
      requireLogin();
      return;
    }

    if (actionsDisabled) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCounts((current) => ({
      ...current,
      likeCount: current.likeCount + (nextLiked ? 1 : -1)
    }));
    likeMutation.mutate(nextLiked, {
      onError: () => {
        setLiked(!nextLiked);
        setCounts((current) => ({
          ...current,
          likeCount: current.likeCount + (nextLiked ? -1 : 1)
        }));
      }
    });
  }

  function handleBookmark() {
    if (!currentUser) {
      requireLogin();
      return;
    }

    if (actionsDisabled) return;
    const nextBookmarked = !bookmarked;
    setBookmarked(nextBookmarked);
    setCounts((current) => ({
      ...current,
      bookmarkCount: current.bookmarkCount + (nextBookmarked ? 1 : -1)
    }));
    bookmarkMutation.mutate(nextBookmarked, {
      onError: () => {
        setBookmarked(!nextBookmarked);
        setCounts((current) => ({
          ...current,
          bookmarkCount: current.bookmarkCount + (nextBookmarked ? -1 : 1)
        }));
      }
    });
  }

  function handleRepost() {
    if (!currentUser) {
      requireLogin();
      return;
    }

    if (actionsDisabled || reposted) return;
    setReposted(true);
    setCounts((current) => ({
      ...current,
      repostCount: current.repostCount + 1
    }));
    repostMutation.mutate(true, {
      onError: () => {
        setReposted(false);
        setCounts((current) => ({
          ...current,
          repostCount: current.repostCount - 1
        }));
      }
    });
  }

  function handleRemoveRepost() {
    if (!currentUser) {
      requireLogin();
      return;
    }
    if (actionsDisabled || !reposted) return;

    setReposted(false);
    setCounts((current) => ({
      ...current,
      repostCount: Math.max(0, current.repostCount - 1)
    }));
    removeRepostMutation.mutate(undefined, {
      onError: () => {
        setReposted(true);
        setCounts((current) => ({
          ...current,
          repostCount: current.repostCount + 1
        }));
      }
    });
  }

  async function handleShare() {
    const origin =
      (typeof window !== "undefined" && window.location?.origin) ||
      process.env.NEXT_PUBLIC_APP_ORIGIN ||
      "http://localhost:3000";
    const url = `${origin}/posts/${targetPostId}`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "LInked post",
          text: post.content || post.quoteText || "Check out this post on LInked",
          url
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // Keep silent when share is cancelled or unavailable.
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-5">
      <ActionControl
        icon={MessageCircle}
        count={counts.commentCount}
        active={false}
        ariaLabel="Reply"
        href={currentUser ? `/posts/${targetPostId}` : getLoginRedirectPath(pathname || `/posts/${targetPostId}`)}
      />
      <ActionControl
        icon={Repeat2}
        count={counts.repostCount}
        active={reposted}
        ariaLabel="Repost"
        onClick={reposted ? handleRemoveRepost : handleRepost}
        disabled={actionsDisabled}
      />
      <ActionControl
        icon={Heart}
        count={counts.likeCount}
        active={liked}
        ariaLabel="Like"
        onClick={handleLike}
        disabled={actionsDisabled}
      />
      <ActionControl
        icon={Bookmark}
        count={counts.bookmarkCount}
        active={bookmarked}
        ariaLabel="Save"
        onClick={handleBookmark}
        disabled={actionsDisabled}
      />
      <ActionControl icon={Share} active={false} ariaLabel="Share" onClick={handleShare} />
    </div>
  );
}
