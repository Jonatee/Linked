"use client";

import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import ProfileHeader from "@/components/profile/profile-header";
import FeedCard from "@/components/feed/feed-card";
import { formatPost } from "@/lib/formatters";
import { FeedSkeleton, ProfileSkeleton } from "@/components/loading/screen-skeletons";
import useAuthStore from "@/stores/auth-store";

function LoadMoreTrigger({ onVisible, disabled }) {
  const ref = useRef(null);

  useEffect(() => {
    if (disabled || !ref.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onVisible();
        }
      },
      {
        rootMargin: "300px 0px"
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [disabled, onVisible]);

  return <div ref={ref} className="h-8 w-full" aria-hidden="true" />;
}

function CommentCard({ comment }) {
  return (
    <article className="rounded-[20px] border border-white/10 bg-[#141212] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/profile/${comment.author?.username || "unknown"}`} className="text-sm font-semibold text-white transition hover:text-accent">
            {comment.author?.profile?.displayName || comment.author?.usernameDisplay || "Unknown"}
          </Link>
          <div className="mt-1 text-xs text-muted">
            @{comment.author?.username || "unknown"} - {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "now"}
          </div>
        </div>
        {comment.post?.id ? (
          <Link href={`/posts/${comment.post.id}`} className="text-xs font-medium text-accent transition hover:text-white">
            View post
          </Link>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-[#ece7e2]">{comment.content}</p>
      {comment.post ? (
        <div className="mt-4 rounded-[16px] border border-white/10 bg-[#100f0f] p-3">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted">Commented on</div>
          <div className="mt-2 text-sm text-white">
            {comment.post.author?.profile?.displayName || comment.post.author?.usernameDisplay || comment.post.author?.username || "Unknown"}
          </div>
          <div className="mt-1 text-xs text-muted">@{comment.post.author?.username || "unknown"}</div>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#d9d1cb]">
            {comment.post.content || "This post has no text content."}
          </p>
        </div>
      ) : null}
    </article>
  );
}

export default function ProfileFeed({ username }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const [activeTab, setActiveTab] = useState("posts");

  const profileQuery = useQuery({
    queryKey: ["profile", username, currentUser?.username || null],
    queryFn: async () => {
      const userResponse = await api.get(`/users/${username}`);
      const user = userResponse.data.data;
      const isSelf = currentUser?.username && currentUser.username.toLowerCase() === user.user.username.toLowerCase();
      const viewerState = {
        ...(user.viewerState || {}),
        isSelf: Boolean(user.viewerState?.isSelf || isSelf)
      };

      return {
        user: {
          ...user,
          viewerState
        }
      };
    },
    enabled: Boolean(username)
  });

  const profileData = profileQuery.data;
  const canLoadTimeline =
    Boolean(profileData?.user?.viewerState?.isSelf) || profileData?.user?.viewerState?.canInteract !== false;

  const timelineConfig = useMemo(
    () => ({
      posts: {
        endpoint: `/users/${username}/posts`,
        emptyMessage: "No posts yet."
      },
      comments: {
        endpoint: `/users/${username}/comments`,
        emptyMessage: "No comments yet."
      },
      likes: {
        endpoint: `/users/${username}/likes`,
        emptyMessage: "No liked posts yet."
      }
    }),
    [username]
  );

  const timelineQuery = useInfiniteQuery({
    queryKey: ["profile-timeline", username, activeTab],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const response = await api.get(timelineConfig[activeTab].endpoint, {
        params: {
          ...(pageParam ? { cursor: pageParam } : {})
        }
      });

      return {
        items: response.data.data || [],
        pageInfo: response.data.meta || {
          nextCursor: null,
          hasMore: false
        }
      };
    },
    getNextPageParam: (lastPage) => (lastPage.pageInfo?.hasMore ? lastPage.pageInfo?.nextCursor : undefined),
    enabled: Boolean(username && profileData && canLoadTimeline)
  });

  if (profileQuery.isLoading) {
    return <ProfileSkeleton />;
  }

  if (profileQuery.error || !profileData) {
    return <div className="panel p-6 text-sm text-accent">Failed to load profile.</div>;
  }

  const items = (timelineQuery.data?.pages || []).flatMap((page) => page.items || []);

  return (
    <>
      <ProfileHeader
        profile={{
          userId: profileData.user.user.id,
          displayName: profileData.user.profile?.displayName || profileData.user.user.usernameDisplay,
          username: profileData.user.user.username,
          bio: profileData.user.profile?.bio || "",
          initials: profileData.user.user.username.slice(0, 2).toUpperCase(),
          avatarUrl: profileData.user.profile?.avatarMedia?.secureUrl || "",
          bannerUrl: profileData.user.profile?.bannerMedia?.secureUrl || "",
          followerCount: profileData.user.user.stats?.followerCount || 0,
          followingCount: profileData.user.user.stats?.followingCount || 0,
          viewerState: profileData.user.viewerState || {
            isSelf: false,
            following: false,
            blockedByViewer: false,
            hasBlockedViewer: false,
            canInteract: true
          }
        }}
      />
      <div className="space-y-4">
        {!canLoadTimeline && !profileData.user.viewerState?.isSelf ? (
          <div className="panel p-6 text-sm text-muted">Content is hidden because this relationship is blocked.</div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          {["posts", "comments", "likes"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                activeTab === tab ? "bg-accent text-white" : "bg-[#171515] text-muted hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {!items.length && !timelineQuery.isLoading && canLoadTimeline ? (
          <div className="panel p-6 text-sm text-muted">{timelineConfig[activeTab].emptyMessage}</div>
        ) : null}
        {activeTab === "comments"
          ? items.map((comment) => <CommentCard key={comment.id} comment={comment} />)
          : items.map((post) => <FeedCard key={post.id} post={formatPost(post)} />)}
        {timelineQuery.hasNextPage ? (
          <LoadMoreTrigger
            disabled={timelineQuery.isFetchingNextPage}
            onVisible={() => {
              if (!timelineQuery.isFetchingNextPage) {
                timelineQuery.fetchNextPage();
              }
            }}
          />
        ) : null}
        {timelineQuery.isFetchingNextPage ? <FeedSkeleton count={1} /> : null}
      </div>
    </>
  );
}
