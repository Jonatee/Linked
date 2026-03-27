"use client";

import Link from "next/link";
import { Repeat2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import SquareAvatar from "@/components/branding/square-avatar";
import VerifiedBadge from "@/components/branding/verified-badge";
import RichContent from "@/components/content/rich-content";
import MediaGallery from "@/components/feed/media-gallery";
import PostActions from "@/components/feed/post-actions";
import PostMoreMenu from "@/components/feed/post-more-menu";

export default function FeedCard({ post, truncateContent = true, navigateOnCard = true }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = truncateContent && (post.content || "").length > 300;
  const visibleContent = shouldTruncate && !expanded ? `${post.content.slice(0, 300).trimEnd()}...` : post.content;

  function handleCardClick(event, postId = post.id) {
    const interactiveTarget = event.target.closest("a, button, video, [role='button'], input, textarea");
    if (interactiveTarget) {
      return;
    }

    router.push(`/posts/${postId}`);
  }

  function handleOriginalPostClick(event, postId) {
    const interactiveTarget = event.target.closest("a, button, video, [role='button'], input, textarea");
    if (interactiveTarget && interactiveTarget !== event.currentTarget) {
      return;
    }

    router.push(`/posts/${postId}`);
  }

  return (
    <article
      className="motion-rise hover-lift border-b border-white/10 px-4 py-4 transition hover:bg-[#1a1818] md:px-5"
      onClick={navigateOnCard && post.id ? handleCardClick : undefined}
    >
      {post.type === "repost" || post.type === "quote_repost" ? (
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted">
          <Repeat2 size={13} />
          <span>{post.author.name} reposted</span>
        </div>
      ) : null}
      <div className="flex gap-3">
        <div className="shrink-0 self-start">
          <Link href={`/profile/${post.author.username}`} className="block h-fit w-fit">
            <SquareAvatar initials={post.author.initials} src={post.author.avatarUrl} alt={post.author.name} size="sm" />
          </Link>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <div className="flex items-center gap-2">
                <Link href={`/profile/${post.author.username}`} className="editorial-title text-sm font-bold text-white hover:text-accent">
                  {post.author.name}
                </Link>
                {post.author.isVerified ? <VerifiedBadge compact /> : null}
              </div>
              <Link href={`/profile/${post.author.username}`} className="text-xs text-muted hover:text-white">
                @{post.author.username}
              </Link>
              <span className="text-xs text-muted">{post.createdAtLabel}</span>
            </div>
            <PostMoreMenu post={post} />
          </div>
          {visibleContent ? (
            <div className="mt-2">
              <RichContent className="text-[14px] leading-6 text-[#ece7e2]" content={visibleContent} />
              {shouldTruncate && !expanded ? (
                <button
                  type="button"
                  className="action-pop mt-2 text-sm text-accent transition hover:text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    setExpanded(true);
                  }}
                >
                  See more
                </button>
              ) : null}
            </div>
          ) : null}
          {post.media?.length ? <MediaGallery media={post.media} /> : null}
          {post.originalPost ? (
            <div
              role="button"
              tabIndex={0}
              onClick={(event) => handleOriginalPostClick(event, post.originalPost.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/posts/${post.originalPost.id}`);
                }
              }}
              className="mt-3 rounded-[18px] border border-white/10 bg-[#121212] p-3 text-left transition hover:border-white/20"
            >
              <div className="flex items-center gap-2.5">
                <div className="shrink-0 self-start">
                  <Link href={`/profile/${post.originalPost.author.username}`} className="block h-fit w-fit">
                    <SquareAvatar
                      initials={post.originalPost.author.initials}
                      src={post.originalPost.author.avatarUrl}
                      alt={post.originalPost.author.name}
                      size="sm"
                    />
                  </Link>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${post.originalPost.author.username}`}
                        className="text-sm font-semibold text-white transition hover:text-accent"
                      >
                        {post.originalPost.author.name}
                      </Link>
                      {post.originalPost.author.isVerified ? <VerifiedBadge compact /> : null}
                    </div>
                    <Link
                      href={`/profile/${post.originalPost.author.username}`}
                      className="text-xs text-muted transition hover:text-white"
                    >
                      @{post.originalPost.author.username}
                    </Link>
                    <span className="text-xs text-muted">{post.originalPost.createdAtLabel}</span>
                  </div>
                </div>
              </div>
              {post.originalPost.content ? (
                <div className="mt-2">
                  <RichContent className="text-sm leading-6 text-[#ece7e2]" content={post.originalPost.content} />
                </div>
              ) : null}
              <div
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                <MediaGallery media={post.originalPost.media || []} />
              </div>
              {post.type === "quote_repost" ? (
                <div className="editorial-title mt-3 text-[10px] font-bold tracking-[0.2em] text-muted">Quote repost</div>
              ) : null}
            </div>
          ) : post.quotePost ? (
            <div className="mt-3 rounded-[18px] border border-white/10 bg-[#121212] p-3">
              <div className="editorial-title text-[10px] font-bold tracking-[0.2em] text-muted">Quote repost</div>
              <RichContent className="mt-2 text-sm leading-6 text-[#ece7e2]" content={post.quotePost.content} />
            </div>
          ) : null}
          <PostActions post={post} />
        </div>
      </div>
    </article>
  );
}
