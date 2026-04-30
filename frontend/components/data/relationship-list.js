"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import api from "@/lib/api";
import SquareAvatar from "@/components/branding/square-avatar";
import VerifiedBadge from "@/components/branding/verified-badge";
import { SearchSkeleton } from "@/components/loading/screen-skeletons";

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
        rootMargin: "320px 0px"
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [disabled, onVisible]);

  return <div ref={ref} className="h-8 w-full" aria-hidden="true" />;
}

export default function RelationshipList({ username, type = "followers" }) {
  const config = useMemo(
    () => ({
      followers: {
        endpoint: `/users/${username}/followers`,
        emptyMessage: "No followers yet."
      },
      following: {
        endpoint: `/users/${username}/following`,
        emptyMessage: "Not following anyone yet."
      }
    }),
    [username]
  );

  const { data, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ["relationships", username, type],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const response = await api.get(config[type].endpoint, {
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
    enabled: Boolean(username)
  });

  if (isLoading) {
    return <SearchSkeleton />;
  }

  if (error) {
    return <div className="panel p-6 text-sm text-accent">Failed to load this list.</div>;
  }

  const items = (data?.pages || []).flatMap((page) => page.items || []);

  if (!items.length) {
    return <div className="panel p-6 text-sm text-muted">{config[type].emptyMessage}</div>;
  }

  return (
    <div className="space-y-4">
      {items.map((user) => (
        <Link
          key={`${type}-${user.id}-${user.followedAt || "item"}`}
          href={`/profile/${user.username}`}
          className="panel block p-5 transition hover:bg-[#1a1818]"
        >
          <div className="flex items-start gap-4">
            <SquareAvatar
              initials={(user.profile?.displayName || user.usernameDisplay || user.username || "UN").slice(0, 2).toUpperCase()}
              src={user.profile?.avatarMedia?.secureUrl || ""}
              alt={user.profile?.displayName || user.usernameDisplay || user.username}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate font-semibold text-white">
                  {user.profile?.displayName || user.usernameDisplay || user.username}
                </div>
                {user.isVerified ? <VerifiedBadge compact /> : null}
              </div>
              <div className="mt-1 text-sm text-muted">@{user.username}</div>
              {user.profile?.bio ? (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#ece7e2]">{user.profile.bio}</p>
              ) : null}
              {type === "following" && user.postNotificationsEnabled ? (
                <div className="mt-3 text-[11px] uppercase tracking-[0.16em] text-accent">Post alerts on</div>
              ) : null}
            </div>
          </div>
        </Link>
      ))}
      {hasNextPage ? (
        <LoadMoreTrigger
          disabled={isFetchingNextPage}
          onVisible={() => {
            if (!isFetchingNextPage) {
              fetchNextPage();
            }
          }}
        />
      ) : null}
      {isFetchingNextPage ? <SearchSkeleton /> : null}
    </div>
  );
}
