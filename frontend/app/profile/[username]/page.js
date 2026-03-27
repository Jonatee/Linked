import AppShell from "@/components/layout/app-shell";
import ProfileFeed from "@/components/data/profile-feed";
import BackButton from "@/components/navigation/back-button";

export default async function ProfilePage({ params }) {
  const { username } = await params;

  return (
    <AppShell requireAuth={false}>
      <BackButton />
      <ProfileFeed username={username} />
    </AppShell>
  );
}
