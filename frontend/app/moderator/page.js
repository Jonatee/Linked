import AppShell from "@/components/layout/app-shell";
import RequireRole from "@/components/auth/require-role";
import { ModeratorDashboardData } from "@/components/data/admin-data";
import BackButton from "@/components/navigation/back-button";

export default function ModeratorPage() {
  return (
    <AppShell rightSidebar={false}>
      <RequireRole roles={["moderator", "admin"]} fallbackPath="/home">
        <BackButton className="hidden lg:inline-flex" />
        <section className="panel p-6">
          <div className="text-3xl font-black tracking-tight">Moderator Tools</div>
          <p className="mt-2 text-sm text-muted">Review reports, hide content, and keep conversations healthy.</p>
        </section>
        <ModeratorDashboardData />
      </RequireRole>
    </AppShell>
  );
}
