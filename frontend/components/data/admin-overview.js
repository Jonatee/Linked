"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, FileText, MessageSquare, ShieldCheck, Users } from "lucide-react";
import api from "@/lib/api";
import AdminTable from "@/components/admin/admin-table";
import { AdminSkeleton } from "@/components/loading/screen-skeletons";
import useAuthStore from "@/stores/auth-store";
import { Button } from "@/components/ui/button";

function StatCard({ label, value, icon: Icon }) {
  return (
    <section className="panel panel-reveal hover-lift p-5">
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
    <section className="panel panel-reveal overflow-hidden p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="editorial-title text-xs font-bold text-muted">Platform Pulse</div>
          <p className="mt-2 max-w-xl text-sm text-muted">
            A quick visual of the current admin-facing volume across the core LInked system surfaces.
          </p>
        </div>
        <div className="w-fit rounded-2xl border border-white/10 bg-[#141212] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-muted">
          Live snapshot
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:mt-8 lg:gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#181414_0%,#121111_100%)] p-4 sm:p-5">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="relative flex h-40 items-end gap-2 sm:h-48 sm:gap-3 lg:h-56">
            {points.map((point) => {
              const height = `${Math.max((point.value / maxValue) * 100, 12)}%`;

              return (
                <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:gap-3">
                  <div className="text-[11px] font-semibold text-white sm:text-xs">{point.value}</div>
                  <div className="flex h-full w-full items-end">
                    <div
                      className={`w-full rounded-t-[14px] sm:rounded-t-[18px] bg-gradient-to-t ${point.color} shadow-[0_18px_40px_rgba(0,0,0,0.28)]`}
                      style={{ height }}
                    />
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.1em] text-muted sm:text-[11px] sm:tracking-[0.14em]">
                    {point.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
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
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: overviewData, isLoading, error } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [statsResponse, logsResponse, reportsResponse] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/audit-logs"),
        api.get("/moderation/reports")
      ]);

      return {
        stats: statsResponse.data.data,
        logs: logsResponse.data.data,
        reports: reportsResponse.data.data
      };
    },
    enabled: currentUser?.role === "admin"
  });
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", page, pageSize],
    queryFn: async () => {
      const response = await api.get("/admin/users", {
        params: {
          page,
          limit: pageSize
        }
      });

      return {
        items: response.data.data,
        meta: response.data.meta
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

  if (error || !overviewData) {
    return <div className="panel p-6 text-sm text-accent">Failed to load admin overview.</div>;
  }

  const usersMeta = usersData?.meta || {};
  const totalPages = Math.max(Math.ceil((usersMeta.total || 0) / (usersMeta.limit || pageSize)), 1);
  const userRows = (usersData?.items || []).map((user) => [user.username, user.role, user.status, user.email]);
  const reportRows = (overviewData.reports || []).slice(0, 8).map((report) => {
    const postHref =
      report.targetType === "post"
        ? `/posts/${report.targetId}`
        : report.targetType === "comment" && report.target?.postId
          ? `/posts/${report.target.postId}`
          : null;
    const userHref = report.targetType === "user" && report.target?.username ? `/profile/${report.target.username}` : null;
    const targetLabel =
      report.targetType === "post"
        ? report.target?.content || "Reported post"
        : report.targetType === "comment"
          ? report.target?.content || "Reported comment"
          : report.target?.usernameDisplay || report.target?.username || "Reported user";

    return [
      report.reasonCode || "general",
      <div key={`${report.id}-target`} className="space-y-1">
        <div className="text-sm text-white">{targetLabel}</div>
        {postHref ? (
          <Link href={postHref} className="text-xs text-accent hover:text-white">
            Open post
          </Link>
        ) : null}
        {userHref ? (
          <Link href={userHref} className="text-xs text-accent hover:text-white">
            Open profile
          </Link>
        ) : null}
      </div>,
      report.description || report.target?.status || "No extra details",
      report.status
    ];
  });

  return (
    <div className="space-y-8">
      <section className="panel panel-reveal p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <ShieldCheck size={22} />
          </div>
          <div className="editorial-title text-3xl font-black text-white">Admin Dashboard</div>
        </div>
        <p className="mt-2 text-sm text-muted">Real platform metrics, user management, reports, and audit activity for LInked.</p>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Users" value={overviewData.stats.users} icon={Users} />
        <StatCard label="Posts" value={overviewData.stats.posts} icon={FileText} />
        <StatCard label="Comments" value={overviewData.stats.comments} icon={MessageSquare} />
        <StatCard label="Audit Logs" value={overviewData.stats.auditLogs} icon={ClipboardList} />
      </div>

      <PulseChart stats={overviewData.stats} />

      <section className="space-y-4">
        <AdminTable
          title={`Users${usersLoading ? " (Loading...)" : ` (${usersMeta.total || 0})`}`}
          columns={["Username", "Role", "Status", "Email"]}
          rows={userRows}
        />
        <div className="flex items-center justify-between gap-4 px-1">
          <div className="text-xs uppercase tracking-[0.18em] text-muted">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-2">
        <AdminTable
          title="Recent Reports"
          columns={["Reason", "Target", "Details", "Status"]}
          rows={reportRows}
        />
        <AdminTable
          title="Audit Logs"
          columns={["Actor", "Action", "Target"]}
          rows={(overviewData.logs || [])
            .slice(0, 8)
            .map((log) => [log.actorId, log.actionType, `${log.targetType}:${log.targetId}`])}
        />
      </div>
    </div>
  );
}
