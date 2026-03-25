"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import NotificationList from "@/components/notifications/notification-list";
import { NotificationsSkeleton } from "@/components/loading/screen-skeletons";

export default function NotificationsData() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get("/notifications");
      return response.data.data;
    }
  });

  if (isLoading) {
    return <NotificationsSkeleton />;
  }

  if (error) {
    return <div className="panel p-6 text-sm text-accent">Failed to load notifications.</div>;
  }

  return (
    <NotificationList
      items={(data || []).map((item) => ({
        id: item.id,
        actor: {
          name:
            item.actor?.profile?.displayName ||
            item.actor?.usernameDisplay ||
            item.actor?.username ||
            "System",
          username: item.actor?.username || "",
          initials: (
            item.actor?.profile?.displayName ||
            item.actor?.usernameDisplay ||
            item.actor?.username ||
            "SY"
          )
            .slice(0, 2)
            .toUpperCase(),
          avatarUrl: item.actor?.profile?.avatarMedia?.secureUrl || ""
        },
        message: item.message || item.type,
        isRead: Boolean(item.isRead),
        targetUrl: item.targetUrl || "/notifications"
      }))}
    />
  );
}
