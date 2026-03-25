import AppShell from "@/components/layout/app-shell";
import AdminOverview from "@/components/data/admin-overview";
import BackButton from "@/components/navigation/back-button";

export default function AdminPage() {
  return (
    <AppShell rightSidebar={false}>
      <BackButton />
      <AdminOverview />
    </AppShell>
  );
}
