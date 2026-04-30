"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SquareAvatar from "@/components/branding/square-avatar";
import VerifiedBadge from "@/components/branding/verified-badge";

function SearchDropdown({ query, isLoading, results, onNavigate }) {
  if (!query) {
    return null;
  }

  const hasUsers = Boolean(results.users?.length);
  const hasTags = Boolean(results.tags?.length);
  const hasPosts = Boolean(results.posts?.length);
  const hasResults = hasUsers || hasTags || hasPosts;

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-50 overflow-hidden rounded-[22px] border border-white/10 bg-[#120f0f] shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
      <div className="max-h-[min(70vh,36rem)] overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {isLoading ? <div className="p-4 text-sm text-muted">Searching for &quot;{query}&quot;...</div> : null}
        {!isLoading && !hasResults ? <div className="p-4 text-sm text-muted">No quick matches found.</div> : null}
        {!isLoading && hasUsers ? (
          <div className="border-b border-white/10 px-4 py-3">
            <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted">People</div>
            <div className="space-y-2">
              {results.users.slice(0, 4).map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  onClick={onNavigate}
                  className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-white/5"
                >
                  <SquareAvatar
                    initials={(user.profile?.displayName || user.usernameDisplay || user.username || "UN").slice(0, 2).toUpperCase()}
                    src={user.profile?.avatarMedia?.secureUrl || ""}
                    alt={user.profile?.displayName || user.usernameDisplay || user.username}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold text-white">{user.profile?.displayName || user.usernameDisplay || user.username}</span>
                      {user.isVerified ? <VerifiedBadge compact /> : null}
                    </div>
                    <div className="text-sm text-muted">@{user.username}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        {!isLoading && hasTags ? (
          <div className="border-b border-white/10 px-4 py-3">
            <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted">Tags</div>
            <div className="flex flex-wrap gap-2">
              {results.tags.slice(0, 6).map((tag) => (
                <Link
                  key={tag.id}
                  href={`/search?q=${encodeURIComponent(tag.normalizedTag || tag.tag)}`}
                  onClick={onNavigate}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#ece7e2] transition hover:border-accent/60 hover:text-white"
                >
                  #{tag.tag || tag.normalizedTag}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        {!isLoading && hasPosts ? (
          <div className="px-4 py-3">
            <div className="mb-3 text-[11px] uppercase tracking-[0.16em] text-muted">Posts</div>
            <div className="space-y-2">
              {results.posts.slice(0, 4).map((post) => (
                <Link
                  key={post.id}
                  href={`/posts/${post.id}`}
                  onClick={onNavigate}
                  className="block rounded-2xl px-2 py-2 transition hover:bg-white/5"
                >
                  <div className="text-sm font-semibold text-white">
                    {post.author?.profile?.displayName || post.author?.usernameDisplay || post.author?.username || "Unknown"}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[#d9d1cb]">{post.content || "Open post"}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        <div className="border-t border-white/10 bg-[#181414] px-4 py-3">
          <Link
            href={`/search?q=${encodeURIComponent(query)}`}
            onClick={onNavigate}
            className="inline-flex w-full items-center justify-center rounded-md border border-white/15 bg-[#201f1f] px-4 py-2 text-sm font-semibold text-[#ece7e2] transition hover:bg-[#2a2a2a]"
          >
            View all results for &quot;{query}&quot;
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ExploreHeader() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const deferredValue = useDeferredValue(value.trim());
  const containerRef = useRef(null);

  const { data, isFetching } = useQuery({
    queryKey: ["explore-search-preview", deferredValue],
    queryFn: async () => {
      const [usersResponse, postsResponse, tagsResponse] = await Promise.all([
        api.get(`/search/users?q=${encodeURIComponent(deferredValue)}`),
        api.get(`/search/posts?q=${encodeURIComponent(deferredValue)}`),
        api.get(`/search/tags?q=${encodeURIComponent(deferredValue)}`)
      ]);

      return {
        users: usersResponse.data.data || [],
        posts: postsResponse.data.data || [],
        tags: tagsResponse.data.data || []
      };
    },
    enabled: deferredValue.length >= 2
  });

  useEffect(() => {
    if (!isDropdownOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDropdownOpen]);

  function handleSubmit(event) {
    event.preventDefault();
    const query = value.trim();

    if (!query) {
      return;
    }

    setIsDropdownOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  function handleNavigate() {
    setIsDropdownOpen(false);
  }

  return (
    <section className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-[#0f0d0d] px-4 pb-4 pt-4 md:-mx-6 md:px-6 lg:top-0 lg:rounded-none">
      <div className="panel relative overflow-visible p-6" ref={containerRef}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Search size={20} />
          </div>
          <div>
            <div className="editorial-title text-3xl font-black text-white">Explore</div>
            <p className="mt-2 text-sm text-muted">Discover trending conversations, creators, and tags.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Input
              value={value}
              onChange={(event) => {
                const nextValue = event.target.value;
                setValue(nextValue);
                setIsDropdownOpen(nextValue.trim().length >= 2);
              }}
              onFocus={() => {
                if (value.trim().length >= 2) {
                  setIsDropdownOpen(true);
                }
              }}
              placeholder="Search users, posts, and tags from Explore"
              className="flex-1"
            />
            {isDropdownOpen ? (
              <SearchDropdown
                query={deferredValue || value.trim()}
                isLoading={isFetching}
                results={data || { users: [], posts: [], tags: [] }}
                onNavigate={handleNavigate}
              />
            ) : null}
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>
    </section>
  );
}
