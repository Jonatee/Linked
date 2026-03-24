"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import SquareAvatar from "@/components/branding/square-avatar";
import FeedCard from "@/components/feed/feed-card";
import { formatPost } from "@/lib/formatters";
import { SearchSkeleton } from "@/components/loading/screen-skeletons";

export default function SearchResults({ query }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["search", query],
    queryFn: async () => {
      const [usersResponse, postsResponse, tagsResponse] = await Promise.all([
        api.get(`/search/users?q=${encodeURIComponent(query)}`),
        api.get(`/search/posts?q=${encodeURIComponent(query)}`),
        api.get(`/search/tags?q=${encodeURIComponent(query)}`)
      ]);

      return {
        users: usersResponse.data.data,
        posts: postsResponse.data.data,
        tags: tagsResponse.data.data
      };
    },
    enabled: Boolean(query)
  });

  if (!query) {
    return <div className="panel p-6 text-sm text-muted">Add a search term in the URL, for example `?q=ada`.</div>;
  }

  if (isLoading) {
    return <SearchSkeleton />;
  }

  if (error || !data) {
    return <div className="panel p-6 text-sm text-accent">Search failed.</div>;
  }

  return (
    <div className="space-y-4">
      {(data.tags || []).slice(0, 5).map((tag) => (
        <Link
          key={tag.id}
          href={`/search?q=${encodeURIComponent(tag.normalizedTag || tag.tag)}`}
          className="panel block p-5 transition hover:bg-[#1a1818]"
        >
          <div className="editorial-title text-xs font-bold text-muted">Tag</div>
          <div className="mt-2 text-lg font-bold text-white">#{tag.tag || tag.normalizedTag}</div>
          <div className="mt-1 text-sm text-muted">{tag.usageCount || 0} posts</div>
        </Link>
      ))}
      {(data.users || []).map((user) => (
        <Link key={user.id} href={`/profile/${user.username}`} className="panel block p-5 transition hover:bg-[#1a1818]">
          <div className="flex items-center gap-4">
            <SquareAvatar
              initials={(user.usernameDisplay || user.username).slice(0, 2).toUpperCase()}
              src={user.profile?.avatarMedia?.secureUrl || ""}
              alt={user.profile?.displayName || user.usernameDisplay || user.username}
            />
            <div>
              <div className="font-semibold">{user.profile?.displayName || user.usernameDisplay}</div>
              <div className="text-sm text-muted">@{user.username}</div>
            </div>
          </div>
        </Link>
      ))}
      {(data.posts || []).map((post) => (
        <FeedCard key={post.id} post={formatPost(post)} />
      ))}
    </div>
  );
}
