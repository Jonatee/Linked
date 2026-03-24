import AppShell from "@/components/layout/app-shell";
import FeedList from "@/components/data/feed-list";

export default function ExplorePage() {
  return (
    <AppShell>
      <section className="panel p-6">
        <div className="editorial-title text-3xl font-black text-white">Explore</div>
        <p className="mt-2 text-sm text-muted">Discover trending conversations, creators, and tags.</p>
      </section>
      <FeedList queryKey={["explore"]} endpoint="/posts/explore" emptyMessage="No explore posts yet." />
    </AppShell>
  );
}
