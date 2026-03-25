"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardList, FileText, MessageSquare, ShieldCheck, Users } from "lucide-react";
import api from "@/lib/api";
import AdminTable from "@/components/admin/admin-table";
import { AdminSkeleton } from "@/components/loading/screen-skeletons";
import useAuthStore from "@/stores/auth-store";

function StatCard({ label, value, icon: Icon }) {
  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="editorial-title text-[10px] font-bold text-muted">{label}</div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/12 text-accent">
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-4 text-3xl font-black text-white">{value}</div>
    </section>
  );
}

function PulseChart({ stats }) {
  const points = [
    { label: "Users", value: stats.users || 0, color: "from-[#f04444] to-[#731010]" },
    { label: "Posts", value: stats.posts || 0, color: "from-[#ff7a59] to-[#9a1b1b]" },
    { label: "Comments", value: stats.comments || 0, color: "from-[#f0b36d] to-[#8b3a1f]" },
    { label: "Audit", value: stats.auditLogs || 0, color: "from-[#d6d6d6] to-[#4b4b4b]" }
  ];

  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <section className="panel overflow-hidden p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="editorial-title text-xs font-bold text-muted">Platform Pulse</div>
          <p className="mt-2 max-w-xl text-sm text-muted">
            A quick visual of the current admin-facing volume across the core LInked system surfaces.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#141212] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-muted">
          Live snapshot
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#181414_0%,#121111_100%)] p-5">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="relative flex h-56 items-end gap-3">
            {points.map((point) => {
              const height = `${Math.max((point.value / maxValue) * 100, 12)}%`;

              return (
                <div key={point.label} className="flex flex-1 flex-col items-center gap-3">
                  <div className="text-xs font-semibold text-white">{point.value}</div>
                  <div className="flex h-full w-full items-end">
                    <div
                      className={`w-full rounded-t-[18px] bg-gradient-to-t ${point.color} shadow-[0_18px_40px_rgba(0,0,0,0.28)]`}
                      style={{ height }}
                    />
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-muted">{point.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3">
          {points.map((point) => (
            <div key={point.label} className="rounded-[20px] border border-white/10 bg-[#141212] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted">{point.label}</div>
              <div className="mt-2 text-2xl font-black text-white">{point.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AdminOverview() {
  const currentUser = useAuthStore((state) => state.currentUser);
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
    },
    enabled: currentUser?.role === "admin"
  });

  if (!currentUser) {
    return <div className="panel p-6 text-sm text-muted">Load your session to access the admin dashboard.</div>;
  }

  if (currentUser.role !== "admin") {
    return <div className="panel p-6 text-sm text-accent">This dashboard is available to admins only.</div>;
  }

  if (isLoading) {
    return <AdminSkeleton />;
  }

  if (error || !data) {
    return <div className="panel p-6 text-sm text-accent">Failed to load admin overview.</div>;
  }

  return (
    <div className="space-y-8">
      <section className="panel p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <ShieldCheck size={22} />
          </div>
          <div className="editorial-title text-3xl font-black text-white">Admin Dashboard</div>
        </div>
        <p className="mt-2 text-sm text-muted">Real platform metrics, user management, reports, and audit activity for LInked.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={data.stats.users} icon={Users} />
        <StatCard label="Posts" value={data.stats.posts} icon={FileText} />
        <StatCard label="Comments" value={data.stats.comments} icon={MessageSquare} />
        <StatCard label="Audit Logs" value={data.stats.auditLogs} icon={ClipboardList} />
      </div>

      <PulseChart stats={data.stats} />

      <AdminTable
        title="Users"
        columns={["Username", "Role", "Status", "Email"]}
        rows={(data.users || []).map((user) => [user.username, user.role, user.status, user.email])}
      />

      <div className="grid gap-8 xl:grid-cols-2">
        <AdminTable
          title="Recent Reports"
          columns={["Reason", "Target", "Status"]}
          rows={(data.reports || [])
            .slice(0, 8)
            .map((report) => [report.reasonCode || "general", `${report.targetType}:${report.targetId}`, report.status])}
        />
        <AdminTable
          title="Audit Logs"
          columns={["Actor", "Action", "Target"]}
          rows={(data.logs || [])
            .slice(0, 8)
            .map((log) => [log.actorId, log.actionType, `${log.targetType}:${log.targetId}`])}
        />
      </div>
    </div>
  );
}
