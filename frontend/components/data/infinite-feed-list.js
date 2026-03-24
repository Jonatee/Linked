"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import FeedCard from "@/components/feed/feed-card";
import { formatPost } from "@/lib/formatters";
import { FeedSkeleton } from "@/components/loading/screen-skeletons";

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

export default function InfiniteFeedList({ queryKey, endpoint, emptyMessage, withContainer = false }) {
  const { data, isLoading, error, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey,
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const response = await api.get(endpoint, {
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
    getNextPageParam: (lastPage) => (lastPage.pageInfo?.hasMore ? lastPage.pageInfo?.nextCursor : undefined)
  });

  if (isLoading) {
    return <FeedSkeleton count={3} />;
  }

  if (error) {
    return <div className="panel p-6 text-sm text-accent">Failed to load feed.</div>;
  }

  const posts = (data?.pages || []).flatMap((page) => page.items || []);

  if (!posts.length) {
    return <div className="panel p-6 text-sm text-muted">{emptyMessage}</div>;
  }

  const content = (
    <>
      {posts.map((post) => (
        <FeedCard key={post.id} post={formatPost(post)} />
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
      {isFetchingNextPage ? <FeedSkeleton count={1} /> : null}
    </>
  );

  if (withContainer) {
    return <div className="overflow-hidden rounded-[18px] border border-white/10 bg-[#151313]">{content}</div>;
  }

  return <div className="space-y-4">{content}</div>;
}
