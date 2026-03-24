"use client";

import InfiniteFeedList from "@/components/data/infinite-feed-list";

export default function BookmarksView() {
  return (
    <div className="space-y-2">
      <section className="panel p-6">
        <div className="editorial-title text-3xl font-black text-white">Bookmarks</div>
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
