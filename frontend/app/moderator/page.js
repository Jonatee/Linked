import AppShell from "@/components/layout/app-shell";
import { ModeratorDashboardData } from "@/components/data/admin-data";

export default function ModeratorPage() {
  return (
    <AppShell rightSidebar={false}>
      <section className="panel p-6">
        <div className="text-3xl font-black tracking-tight">Moderator Tools</div>
        <p className="mt-2 text-sm text-muted">Review reports, hide content, and keep conversations healthy.</p>
      </section>
      <ModeratorDashboardData />
    </AppShell>
  );
}
