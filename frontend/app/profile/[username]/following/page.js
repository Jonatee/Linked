import AppShell from "@/components/layout/app-shell";
import RelationshipList from "@/components/data/relationship-list";
import BackButton from "@/components/navigation/back-button";

export default async function FollowingPage({ params }) {
  const { username } = await params;

  return (
    <AppShell requireAuth={false}>
      <BackButton fallback={`/profile/${username}`} />
      <RelationshipList username={username} type="following" />
    </AppShell>
  );
}
