"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import AdminTable from "@/components/admin/admin-table";
import { AdminSkeleton } from "@/components/loading/screen-skeletons";

function StatCard({ label, value }) {
  return (
    <section className="panel p-5">
      <div className="editorial-title text-[10px] font-bold text-muted">{label}</div>
      <div className="mt-4 text-3xl font-black text-white">{value}</div>
    </section>
  );
}

export default function AdminOverview() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [statsResponse, usersResponse, logsResponse, reportsResponse] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/audit-logs"),
        api.get("/moderation/reports")
      ]);

      return {
        stats: statsResponse.data.data,
        users: usersResponse.data.data,
        logs: logsResponse.data.data,
        reports: reportsResponse.data.data
      };
    }
  });

  if (isLoading) {
    return <AdminSkeleton />;
  }

  if (error || !data) {
    return <div className="panel p-6 text-sm text-accent">Failed to load admin overview.</div>;
  }

  return (
    <div className="space-y-8">
      <section className="panel p-6">
        <div className="editorial-title text-3xl font-black text-white">Admin Dashboard</div>
        <p className="mt-2 text-sm text-muted">Real platform metrics, user management, reports, and audit activity for LInked.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={data.stats.users} />
        <StatCard label="Posts" value={data.stats.posts} />
        <StatCard label="Comments" value={data.stats.comments} />
        <StatCard label="Audit Logs" value={data.stats.auditLogs} />
      </div>

      <AdminTable
        title="Users"
        columns={["Username", "Role", "Status", "Email"]}
        rows={(data.users || []).map((user) => [user.username, user.role, user.status, user.email])}
      />

      <div className="grid gap-8 xl:grid-cols-2">
        <AdminTable
          title="Recent Reports"
          columns={["Reason", "Target", "Status"]}
          rows={(data.reports || []).slice(0, 8).map((report) => [report.reasonCode, report.targetId, report.status])}
        />
        <AdminTable
          title="Audit Logs"
          columns={["Actor", "Action", "Target"]}
          rows={(data.logs || []).slice(0, 8).map((log) => [log.actorId, log.actionType, log.targetId])}
        />
      </div>
    </div>
  );
}
