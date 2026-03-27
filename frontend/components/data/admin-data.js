"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import AdminTable from "@/components/admin/admin-table";
import { Button } from "@/components/ui/button";

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
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["moderation-reports"],
    queryFn: async () => {
      const response = await api.get("/moderation/reports");
      return response.data.data;
    }
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ id, status, resolutionNote = "" }) => {
      await api.patch(`/moderation/reports/${id}`, {
        status,
        resolutionNote
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });
    }
  });

  const moderateTargetMutation = useMutation({
    mutationFn: async ({ report, actionType, reason }) => {
      await api.post("/moderation/actions", {
        targetType: report.targetType,
        targetId: report.targetId,
        actionType,
        reason,
        metadata: {
          reportId: report.id
        }
      });

      await api.patch(`/moderation/reports/${report.id}`, {
        status: "resolved",
        resolutionNote: reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-reports"] });
    }
  });

  if (isLoading) {
    return <div className="panel p-6 text-sm text-muted">Loading moderation queue...</div>;
  }

  if (error) {
    return <div className="panel p-6 text-sm text-accent">Failed to load moderation queue.</div>;
  }

  const rows = (data || []).map((report) => {
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
    const isBusy = updateReportMutation.isPending || moderateTargetMutation.isPending;

    return [
      report.reasonCode,
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
      report.description || report.target?.status || "No details provided",
      report.status,
      <div key={`${report.id}-actions`} className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={isBusy}
          onClick={() => updateReportMutation.mutate({ id: report.id, status: "reviewing", resolutionNote: "Under review" })}
        >
          Review
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={isBusy || !["post", "comment"].includes(report.targetType)}
          onClick={() =>
            moderateTargetMutation.mutate({
              report,
              actionType: "hide",
              reason: `Hidden after report: ${report.reasonCode}`
            })
          }
        >
          {report.targetType === "comment" ? "Hide comment" : "Hide post"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isBusy}
          onClick={() => updateReportMutation.mutate({ id: report.id, status: "dismissed", resolutionNote: "Dismissed by moderator" })}
        >
          Dismiss
        </Button>
        {report.targetType === "user" ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isBusy}
            onClick={() =>
              moderateTargetMutation.mutate({
                report,
                actionType: "suspend",
                reason: `Suspended after report: ${report.reasonCode}`
              })
            }
          >
            Suspend user
          </Button>
        ) : null}
      </div>
    ];
  });

  return (
    <AdminTable
      title="Open Reports"
      columns={["Reason", "Target", "Details", "Status", "Actions"]}
      rows={rows}
    />
  );
}
