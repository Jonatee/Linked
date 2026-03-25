import Link from "next/link";
import { Repeat2 } from "lucide-react";
import SquareAvatar from "@/components/branding/square-avatar";
import RichContent from "@/components/content/rich-content";
import MediaGallery from "@/components/feed/media-gallery";
import PostActions from "@/components/feed/post-actions";
import PostMoreMenu from "@/components/feed/post-more-menu";

export default function FeedCard({ post }) {
  return (
    <article className="border-b border-white/10 p-5 transition hover:bg-[#1a1818]">
      {post.type === "repost" || post.type === "quote_repost" ? (
        <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted">
          <Repeat2 size={13} />
          <span>{post.author.name} reposted</span>
        </div>
      ) : null}
      <div className="flex gap-4">
        <Link href={`/profile/${post.author.username}`} className="shrink-0">
          <SquareAvatar initials={post.author.initials} src={post.author.avatarUrl} alt={post.author.name} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/profile/${post.author.username}`} className="editorial-title font-bold text-white hover:text-accent">
                {post.author.name}
              </Link>
              <Link href={`/profile/${post.author.username}`} className="text-sm text-muted hover:text-white">
                @{post.author.username}
              </Link>
              <div className="text-sm text-muted">{post.createdAtLabel}</div>
            </div>
            <PostMoreMenu post={post} />
          </div>
          <Link href={`/posts/${post.id}`} className="block">
            {post.content ? (
              <RichContent className="mt-3 text-[15px] leading-7 text-[#ece7e2]" content={post.content} />
            ) : null}
            {post.media?.length ? <MediaGallery media={post.media} /> : null}
            {post.originalPost ? (
              <div className="mt-4 rounded-[18px] border border-white/10 bg-[#121212] p-4">
                <div className="flex items-center gap-3">
                  <SquareAvatar
                    initials={post.originalPost.author.initials}
                    src={post.originalPost.author.avatarUrl}
                    alt={post.originalPost.author.name}
                    size="sm"
                  />
                  <div>
                    <div className="font-semibold text-white">{post.originalPost.author.name}</div>
                    <div className="text-xs text-muted">@{post.originalPost.author.username}</div>
                  </div>
                </div>
                <RichContent className="mt-3 text-sm text-[#ece7e2]" content={post.originalPost.content} />
                <MediaGallery media={post.originalPost.media || []} />
                {post.type === "quote_repost" ? (
                  <div className="editorial-title mt-4 text-[10px] font-bold tracking-[0.2em] text-muted">Quote repost</div>
                ) : null}
              </div>
            ) : post.quotePost ? (
              <div className="mt-4 rounded-[18px] border border-white/10 bg-[#121212] p-4">
                <div className="editorial-title text-[10px] font-bold tracking-[0.2em] text-muted">Quote repost</div>
                <RichContent className="mt-2 text-sm text-[#ece7e2]" content={post.quotePost.content} />
              </div>
            ) : null}
          </Link>
          <PostActions post={post} />
        </div>
      </div>
    </article>
  );
}
