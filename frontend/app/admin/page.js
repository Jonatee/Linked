import AppShell from "@/components/layout/app-shell";
import AdminOverview from "@/components/data/admin-overview";

export default function AdminPage() {
  return (
    <AppShell rightSidebar={false}>
      <AdminOverview />
    </AppShell>
  );
}
