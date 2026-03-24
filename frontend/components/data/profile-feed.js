"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import ProfileHeader from "@/components/profile/profile-header";
import FeedCard from "@/components/feed/feed-card";
import { formatPost } from "@/lib/formatters";
import { FeedSkeleton, ProfileSkeleton } from "@/components/loading/screen-skeletons";
import useAuthStore from "@/stores/auth-store";
import { useEffect, useRef } from "react";

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

export default function ProfileFeed({ username }) {
  const currentUser = useAuthStore((state) => state.currentUser);
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
  const canLoadPosts =
    Boolean(profileData?.user?.viewerState?.isSelf) || profileData?.user?.viewerState?.canInteract !== false;

  const postsQuery = useInfiniteQuery({
    queryKey: ["profile-posts", username],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const response = await api.get(`/users/${username}/posts`, {
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
    enabled: Boolean(username && profileData && canLoadPosts)
  });

  if (profileQuery.isLoading) {
    return <ProfileSkeleton />;
  }

  if (profileQuery.error || !profileData) {
    return <div className="panel p-6 text-sm text-accent">Failed to load profile.</div>;
  }

  const posts = (postsQuery.data?.pages || []).flatMap((page) => page.items || []);

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
        {!canLoadPosts && !profileData.user.viewerState?.isSelf ? (
          <div className="panel p-6 text-sm text-muted">Posts are hidden because this relationship is blocked.</div>
        ) : null}
        {!posts.length && !postsQuery.isLoading && canLoadPosts ? (
          <div className="panel p-6 text-sm text-muted">No posts yet.</div>
        ) : null}
        {posts.map((post) => (
          <FeedCard key={post.id} post={formatPost(post)} />
        ))}
        {postsQuery.hasNextPage ? (
          <LoadMoreTrigger
            disabled={postsQuery.isFetchingNextPage}
            onVisible={() => {
              if (!postsQuery.isFetchingNextPage) {
                postsQuery.fetchNextPage();
              }
            }}
          />
        ) : null}
        {postsQuery.isFetchingNextPage ? <FeedSkeleton count={1} /> : null}
      </div>
    </>
  );
}
