import AppShell from "@/components/layout/app-shell";
import FeedList from "@/components/data/feed-list";
import ExploreHeader from "@/components/explore/explore-header";

export default function ExplorePage() {
  return (
    <AppShell>
      <ExploreHeader />
      <FeedList queryKey={["explore"]} endpoint="/posts/explore" emptyMessage="No explore posts yet." />
    </AppShell>
  );
}
