import AppShell from "@/components/layout/app-shell";
import RequireRole from "@/components/auth/require-role";
import AdminOverview from "@/components/data/admin-overview";
import BackButton from "@/components/navigation/back-button";

export default function AdminPage() {
  return (
    <AppShell rightSidebar={false}>
      <RequireRole roles={["admin"]} fallbackPath="/home">
        <BackButton />
        <AdminOverview />
      </RequireRole>
    </AppShell>
  );
}
