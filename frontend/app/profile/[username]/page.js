import AppShell from "@/components/layout/app-shell";
import ProfileFeed from "@/components/data/profile-feed";

export default async function ProfilePage({ params }) {
  const { username } = await params;

  return (
    <AppShell>
      <ProfileFeed username={username} />
    </AppShell>
  );
}
