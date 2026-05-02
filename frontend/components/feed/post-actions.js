"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Heart, MessageCircle, PenSquare, Repeat2, Share } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import api from "@/lib/api";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import useAuthStore from "@/stores/auth-store";

function ActionControl({ icon: Icon, count, label, active, onClick, disabled = false, href, ariaLabel }) {
  const detail = label ?? count;

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className="inline-flex items-center gap-2 text-xs text-muted transition hover:text-white">
        <span className="action-pop inline-flex items-center gap-2">
          <Icon size={16} fill={active ? "currentColor" : "none"} />
          {detail !== undefined && detail !== null ? <span>{detail}</span> : null}
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
      {detail !== undefined && detail !== null ? <span>{detail}</span> : null}
    </Button>
  );
}

function RepostChooser({ open, onClose, onRepost, onQuote }) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-[24px] border border-white/12 bg-[#141111] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.55)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div>
            <div className="editorial-title text-sm font-black text-white">Share this post</div>
            <p className="mt-1 text-sm text-muted">Choose a direct repost or add your own take.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm uppercase tracking-[0.16em] text-muted transition hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={onRepost}
            className="flex w-full items-start gap-3 rounded-[18px] border border-white/8 bg-[#191515] px-4 py-4 text-left transition hover:border-white/15 hover:bg-white/5"
          >
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <Repeat2 size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Repost</div>
              <div className="mt-1 text-xs leading-5 text-muted">Share it instantly with your followers.</div>
            </div>
          </button>
          <button
            type="button"
            onClick={onQuote}
            className="flex w-full items-start gap-3 rounded-[18px] border border-white/8 bg-[#191515] px-4 py-4 text-left transition hover:border-white/15 hover:bg-white/5"
          >
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <PenSquare size={18} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Quote repost</div>
              <div className="mt-1 text-xs leading-5 text-muted">Add your own text before reposting it.</div>
            </div>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function PostActions({ post }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.currentUser);
  const targetPostId = post.actionPostId || post.id;
  const canInteract = post.viewerState?.canInteract ?? post.viewerState?.relationship?.canInteract ?? true;
  const shareFeedbackTimeoutRef = useRef(null);
  const [liked, setLiked] = useState(Boolean(post.viewerState?.liked));
  const [bookmarked, setBookmarked] = useState(Boolean(post.viewerState?.bookmarked));
  const [reposted, setReposted] = useState(Boolean(post.viewerState?.reposted));
  const [repostType, setRepostType] = useState(post.viewerState?.repostType || null);
  const [repostChooserOpen, setRepostChooserOpen] = useState(false);
  const [quoteComposerOpen, setQuoteComposerOpen] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [shareFeedback, setShareFeedback] = useState("");
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
    setRepostType(post.viewerState?.repostType || null);
    setRepostChooserOpen(false);
    setQuoteComposerOpen(false);
    setQuoteText("");
    setShareFeedback("");
    setCounts({
      likeCount: post.stats.likeCount || 0,
      bookmarkCount: post.stats.bookmarkCount || 0,
      repostCount: post.stats.repostCount || 0,
      commentCount: post.stats.commentCount || 0
    });
  }, [post]);

  useEffect(() => {
    return () => {
      if (shareFeedbackTimeoutRef.current) {
        window.clearTimeout(shareFeedbackTimeoutRef.current);
      }
    };
  }, []);

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
    mutationFn: async ({ type, nextQuoteText = "" }) => {
      await api.post(`/posts/${targetPostId}/repost`, { type, quoteText: nextQuoteText });
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
    [bookmarkMutation.isPending, canInteract, likeMutation.isPending, removeRepostMutation.isPending, repostMutation.isPending]
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

  function handleRepostButton() {
    if (!currentUser) {
      requireLogin();
      return;
    }

    if (actionsDisabled) return;

    if (reposted) {
      handleRemoveRepost();
      return;
    }

    setRepostChooserOpen(true);
  }

  function handleRepost(type, nextQuoteText = "") {
    if (!currentUser) {
      requireLogin();
      return;
    }

    if (actionsDisabled || reposted) return;

    setRepostChooserOpen(false);
    setQuoteComposerOpen(false);
    setQuoteText("");
    setReposted(true);
    setRepostType(type);
    setCounts((current) => ({
      ...current,
      repostCount: current.repostCount + 1
    }));

    repostMutation.mutate(
      { type, nextQuoteText },
      {
        onError: () => {
          setReposted(false);
          setRepostType(null);
          setCounts((current) => ({
            ...current,
            repostCount: Math.max(0, current.repostCount - 1)
          }));
        }
      }
    );
  }

  function handleRemoveRepost() {
    if (!currentUser) {
      requireLogin();
      return;
    }
    if (actionsDisabled || !reposted) return;

    const previousType = repostType;
    setRepostChooserOpen(false);
    setQuoteComposerOpen(false);
    setQuoteText("");
    setReposted(false);
    setRepostType(null);
    setCounts((current) => ({
      ...current,
      repostCount: Math.max(0, current.repostCount - 1)
    }));
    removeRepostMutation.mutate(undefined, {
      onError: () => {
        setReposted(true);
        setRepostType(previousType);
        setCounts((current) => ({
          ...current,
          repostCount: current.repostCount + 1
        }));
      }
    });
  }

  function showShareFeedback() {
    setShareFeedback("Copied");
    if (shareFeedbackTimeoutRef.current) {
      window.clearTimeout(shareFeedbackTimeoutRef.current);
    }
    shareFeedbackTimeoutRef.current = window.setTimeout(() => {
      setShareFeedback("");
    }, 1800);
  }

  async function handleShare() {
    const origin =
      (typeof window !== "undefined" && window.location?.origin) ||
      process.env.NEXT_PUBLIC_APP_ORIGIN ||
      "http://localhost:3000";
    const url = `${origin}/posts/${targetPostId}`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ url });
        showShareFeedback();
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showShareFeedback();
      }
    } catch {
      // Keep silent when share is cancelled or unavailable.
    }
  }

  return (
    <>
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
          ariaLabel={repostType === "quote_repost" ? "Quote repost" : "Repost"}
          onClick={handleRepostButton}
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
        <ActionControl icon={Share} label={shareFeedback} active={false} ariaLabel="Share" onClick={handleShare} />
      </div>

      <RepostChooser
        open={repostChooserOpen}
        onClose={() => setRepostChooserOpen(false)}
        onRepost={() => handleRepost("repost")}
        onQuote={() => {
          setRepostChooserOpen(false);
          setQuoteComposerOpen(true);
        }}
      />

      {quoteComposerOpen && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onClick={() => { if (repostMutation.isPending) return; setQuoteComposerOpen(false); setQuoteText(""); }}>
          <div className="w-full max-w-lg rounded-[26px] border border-white/12 bg-[#141111] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <div className="editorial-title text-lg font-black text-white">Quote repost</div>
                <p className="mt-1 text-sm text-muted">Add what you want to say before reposting.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (repostMutation.isPending) return;
                  setQuoteComposerOpen(false);
                  setQuoteText("");
                }}
                className="text-xs uppercase tracking-[0.16em] text-muted transition hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="mt-4 rounded-[20px] border border-white/8 bg-[#100e0e] p-3">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted">Original post</div>
              <div className="mt-2 line-clamp-3 text-sm leading-6 text-[#ece7e2]">
                {post.originalPost?.content || post.content || "Share this post with your own take."}
              </div>
            </div>
            <Textarea
              value={quoteText}
              onChange={(event) => setQuoteText(event.target.value.slice(0, 500))}
              placeholder="Add your thoughts"
              className="mt-4 min-h-[140px] rounded-[20px] border border-white/8 bg-[#100e0e]"
            />
            <div className="mt-2 text-right text-xs text-muted">{quoteText.length}/500</div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  if (repostMutation.isPending) return;
                  setQuoteComposerOpen(false);
                  setQuoteText("");
                }}
                className="rounded-full px-4 text-xs uppercase tracking-[0.14em] text-muted"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleRepost("quote_repost", quoteText.trim())}
                loading={repostMutation.isPending}
                disabled={!quoteText.trim()}
                className="rounded-full px-5 text-xs uppercase tracking-[0.14em]"
              >
                Quote repost
              </Button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </>
  );
}
