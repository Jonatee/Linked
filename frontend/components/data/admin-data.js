"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import AdminTable from "@/components/admin/admin-table";

export function AdminDashboardData() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const [statsResponse, usersResponse, logsResponse] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/audit-logs")
      ]);

      return {
        stats: statsResponse.data.data,
        users: usersResponse.data.data,
        logs: logsResponse.data.data
      };
    }
  });

  if (isLoading) {
    return <div className="panel p-6 text-sm text-muted">Loading admin data...</div>;
  }

  if (error || !data) {
    return <div className="panel p-6 text-sm text-accent">Failed to load admin data.</div>;
  }

  return (
    <>
      <AdminTable
        title={`Users (${data.stats.users})`}
        columns={["Username", "Role", "Status"]}
        rows={(data.users || []).map((user) => [user.username, user.role, user.status])}
      />
      <AdminTable
        title="Audit Logs"
        columns={["Actor", "Action", "Target"]}
        rows={(data.logs || []).map((log) => [log.actorId, log.actionType, log.targetId])}
      />
    </>
  );
}

export function ModeratorDashboardData() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["moderation-reports"],
    queryFn: async () => {
      const response = await api.get("/moderation/reports");
      return response.data.data;
    }
  });

  if (isLoading) {
    return <div className="panel p-6 text-sm text-muted">Loading moderation queue...</div>;
  }

  if (error) {
    return <div className="panel p-6 text-sm text-accent">Failed to load moderation queue.</div>;
  }

  return (
    <AdminTable
      title="Open Reports"
      columns={["Reason", "Target", "Status"]}
      rows={(data || []).map((report) => [report.reasonCode, report.targetId, report.status])}
    />
  );
}

