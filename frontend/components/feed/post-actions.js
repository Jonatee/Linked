"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

function ActionControl({ icon: Icon, label, count, active, onClick, disabled = false, href }) {
  if (href) {
    return (
      <Link href={href} className="inline-flex items-center gap-2 text-xs text-muted transition hover:text-white">
        <Icon size={16} fill={active ? "currentColor" : "none"} />
        <span>{label}</span>
        {typeof count === "number" ? <span>{count}</span> : null}
      </Link>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      className={`gap-2 px-0 py-0 text-xs ${active ? "text-accent" : "text-muted"}`}
    >
      <Icon size={16} fill={active ? "currentColor" : "none"} />
      <span>{label}</span>
      {typeof count === "number" ? <span>{count}</span> : null}
    </Button>
  );
}

export default function PostActions({ post }) {
  const queryClient = useQueryClient();
  const targetPostId = post.actionPostId || post.id;
  const canInteract = post.viewerState.canInteract;
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

  const actionsDisabled = useMemo(
    () => !canInteract || likeMutation.isPending || bookmarkMutation.isPending || repostMutation.isPending,
    [bookmarkMutation.isPending, canInteract, likeMutation.isPending, repostMutation.isPending]
  );

  function handleLike() {
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

  return (
    <div className="mt-4 flex flex-wrap items-center gap-5">
      <ActionControl icon={MessageCircle} label="Reply" count={counts.commentCount} active={false} href={`/posts/${targetPostId}`} />
      <ActionControl
        icon={Repeat2}
        label="Repost"
        count={counts.repostCount}
        active={reposted}
        onClick={handleRepost}
        disabled={actionsDisabled}
      />
      <ActionControl icon={Heart} label="Like" count={counts.likeCount} active={liked} onClick={handleLike} disabled={actionsDisabled} />
      <ActionControl
        icon={Bookmark}
        label="Save"
        count={counts.bookmarkCount}
        active={bookmarked}
        onClick={handleBookmark}
        disabled={actionsDisabled}
      />
      <ActionControl icon={Share} label="Share" active={false} />
    </div>
  );
}
