"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Input } from "@/components/ui/input";
import SquareAvatar from "@/components/branding/square-avatar";
import { Skeleton } from "@/components/ui/skeleton";

function SidebarSectionSkeleton({ lines = 4 }) {
  return (
    <section className="panel p-5">
      <Skeleton className="mb-4 h-4 w-24" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </section>
  );
}

export default function RightSidebar() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");

  const tagsQuery = useQuery({
    queryKey: ["sidebar-tags"],
    queryFn: async () => {
      const response = await api.get("/search/tags?q=");
      return response.data.data || [];
    }
  });

  const usersQuery = useQuery({
    queryKey: ["sidebar-users"],
    queryFn: async () => {
      const response = await api.get("/search/users?q=");
      return response.data.data || [];
    }
  });

  function handleSubmit(event) {
    event.preventDefault();
    const value = searchValue.trim();
    if (!value) {
      return;
    }

    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <aside className="space-y-6">
      <section className="panel p-5">
        <div className="editorial-title mb-3 text-xs font-bold text-muted">Search</div>
        <form onSubmit={handleSubmit}>
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search users, posts, tags"
          />
        </form>
      </section>

      {tagsQuery.isLoading ? (
        <SidebarSectionSkeleton lines={4} />
      ) : (
        <section className="panel p-5">
          <div className="editorial-title mb-4 text-xs font-bold text-muted">Currents</div>
          <div className="space-y-3">
            {(tagsQuery.data || []).slice(0, 5).map((tag) => (
              <Link
                key={tag.id}
                href={`/search?q=${encodeURIComponent(tag.normalizedTag || tag.tag)}`}
                className="block rounded-md bg-[#111] px-4 py-3 text-sm text-[#ece7e2] transition hover:bg-[#171717]"
              >
                <div className="font-semibold">#{tag.tag || tag.normalizedTag}</div>
                <div className="mt-1 text-xs text-muted">{tag.usageCount || 0} posts</div>
              </Link>
            ))}
            {!tagsQuery.data?.length ? (
              <div className="rounded-md bg-[#111] px-4 py-3 text-sm text-muted">No trending tags yet.</div>
            ) : null}
          </div>
        </section>
      )}

      {usersQuery.isLoading ? (
        <SidebarSectionSkeleton lines={3} />
      ) : (
        <section className="panel p-5">
          <div className="editorial-title mb-4 text-xs font-bold text-muted">Suggested</div>
          <div className="space-y-4">
            {(usersQuery.data || []).slice(0, 4).map((user) => {
              const displayName = user.profile?.displayName || user.usernameDisplay || user.username;
              return (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-3 rounded-md px-1 py-1 transition hover:bg-white/5"
                >
                  <SquareAvatar initials={displayName.slice(0, 2).toUpperCase()} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{displayName}</div>
                    <div className="text-xs text-muted">@{user.username}</div>
                  </div>
                </Link>
              );
            })}
            {!usersQuery.data?.length ? (
              <div className="text-sm text-muted">No suggestions available yet.</div>
            ) : null}
          </div>
        </section>
      )}
    </aside>
  );
}
