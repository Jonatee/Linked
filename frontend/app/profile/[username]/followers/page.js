import AppShell from "@/components/layout/app-shell";
import RelationshipList from "@/components/data/relationship-list";
import BackButton from "@/components/navigation/back-button";

export default async function FollowersPage({ params }) {
  const { username } = await params;

  return (
    <AppShell requireAuth={false}>
      <BackButton fallback={`/profile/${username}`} className="hidden lg:inline-flex" />
      <RelationshipList username={username} type="followers" />
    </AppShell>
  );
}
