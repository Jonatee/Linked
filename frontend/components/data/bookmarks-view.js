"use client";

import { Bookmark } from "lucide-react";
import InfiniteFeedList from "@/components/data/infinite-feed-list";

export default function BookmarksView() {
  return (
    <div className="space-y-2">
      <section className="panel p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Bookmark size={20} />
          </div>
          <div className="editorial-title text-3xl font-black text-white">Bookmarks</div>
        </div>
        <p className="mt-2 text-sm text-muted">Your saved posts, connected directly to the development API.</p>
      </section>
      <InfiniteFeedList
        queryKey={["bookmarks"]}
        endpoint="/bookmarks"
        emptyMessage="No bookmarks yet."
        withContainer
      />
    </div>
  );
}
