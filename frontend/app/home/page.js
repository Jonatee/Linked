import AppShell from "@/components/layout/app-shell";
import FeedList from "@/components/data/feed-list";

export default function HomePage() {
  return (
    <AppShell requireAuth={false}>
      <section className="panel p-6">
        <div className="editorial-title text-3xl font-black text-white">Home</div>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Followed posts, reposts, and your own updates flow through here first.
        </p>
      </section>
      <FeedList queryKey={["feed"]} endpoint="/posts/feed" emptyMessage="Your home feed is empty." />
    </AppShell>
  );
}
