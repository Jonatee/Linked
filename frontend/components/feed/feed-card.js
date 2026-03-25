"use client";

import Link from "next/link";
import { Repeat2 } from "lucide-react";
import { useRouter } from "next/navigation";
import SquareAvatar from "@/components/branding/square-avatar";
import RichContent from "@/components/content/rich-content";
import MediaGallery from "@/components/feed/media-gallery";
import PostActions from "@/components/feed/post-actions";
import PostMoreMenu from "@/components/feed/post-more-menu";

export default function FeedCard({ post }) {
  const router = useRouter();

  function handleOriginalPostClick(event, postId) {
    const interactiveTarget = event.target.closest("a, button, video, [role='button']");
    if (interactiveTarget && interactiveTarget !== event.currentTarget) {
      return;
    }

    router.push(`/posts/${postId}`);
  }

  return (
    <article className="border-b border-white/10 px-4 py-4 transition hover:bg-[#1a1818] md:px-5">
      {post.type === "repost" || post.type === "quote_repost" ? (
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted">
          <Repeat2 size={13} />
          <span>{post.author.name} reposted</span>
        </div>
      ) : null}
      <div className="flex gap-3">
        <Link href={`/profile/${post.author.username}`} className="shrink-0">
          <SquareAvatar initials={post.author.initials} src={post.author.avatarUrl} alt={post.author.name} size="sm" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link href={`/profile/${post.author.username}`} className="editorial-title text-sm font-bold text-white hover:text-accent">
                {post.author.name}
              </Link>
              <Link href={`/profile/${post.author.username}`} className="text-xs text-muted hover:text-white">
                @{post.author.username}
              </Link>
              <Link href={`/posts/${post.id}`} className="text-xs text-muted hover:text-white">
                {post.createdAtLabel}
              </Link>
            </div>
            <PostMoreMenu post={post} />
          </div>
          {post.content ? (
            <RichContent className="mt-2 text-[14px] leading-6 text-[#ece7e2]" content={post.content} />
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
                <Link href={`/profile/${post.originalPost.author.username}`} className="shrink-0">
                  <SquareAvatar
                    initials={post.originalPost.author.initials}
                    src={post.originalPost.author.avatarUrl}
                    alt={post.originalPost.author.name}
                    size="sm"
                  />
                </Link>
                <div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      href={`/profile/${post.originalPost.author.username}`}
                      className="text-sm font-semibold text-white transition hover:text-accent"
                    >
                      {post.originalPost.author.name}
                    </Link>
                    <Link
                      href={`/profile/${post.originalPost.author.username}`}
                      className="text-xs text-muted transition hover:text-white"
                    >
                      @{post.originalPost.author.username}
                    </Link>
                    <Link href={`/posts/${post.originalPost.id}`} className="text-xs text-muted transition hover:text-white">
                      {post.originalPost.createdAtLabel}
                    </Link>
                  </div>
                </div>
              </div>
              {post.originalPost.content ? (
                <div className="mt-2">
                  <RichContent className="text-sm leading-6 text-[#ece7e2]" content={post.originalPost.content} />
                </div>
              ) : null}
              <MediaGallery media={post.originalPost.media || []} />
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
