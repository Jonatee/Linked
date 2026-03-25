"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import SquareAvatar from "@/components/branding/square-avatar";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function NotificationList({ items = [] }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const markReadMutation = useMutation({
    mutationFn: async (id) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      await api.patch("/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  async function handleCardClick(item) {
    if (!item.isRead) {
      await markReadMutation.mutateAsync(item.id);
    }

    router.push(item.targetUrl || "/notifications");
  }

  async function handleMarkRead(event, item) {
    event.stopPropagation();
    await markReadMutation.mutateAsync(item.id);
  }

  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <div className="space-y-4">
      <div className="panel flex items-center justify-between p-4">
        <div>
          <div className="editorial-title text-sm font-bold text-white">Unread</div>
          <div className="text-xs text-muted">{unreadCount} notifications waiting</div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => markAllMutation.mutate()}
          disabled={!unreadCount || markAllMutation.isPending}
          loading={markAllMutation.isPending}
          className={!unreadCount ? "cursor-not-allowed opacity-50" : ""}
        >
          Mark all as read
        </Button>
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick(item)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleCardClick(item);
            }
          }}
          className={`panel w-full p-4 text-left transition hover:bg-[#1a1818] ${!item.isRead ? "border border-accent/35" : ""}`}
        >
          <div className="flex items-start gap-3">
            <SquareAvatar
              initials={item.actor.initials}
              src={item.actor.avatarUrl}
              alt={item.actor.name}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="editorial-title text-sm font-bold text-white">{item.actor.name}</div>
                  <p className="mt-1 text-sm text-muted">{item.message}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className={`shrink-0 px-2 py-1 text-[11px] ${item.isRead ? "cursor-not-allowed opacity-50" : ""}`}
                  onClick={(event) => handleMarkRead(event, item)}
                  disabled={item.isRead || markReadMutation.isPending}
                  loading={markReadMutation.isPending && !item.isRead}
                >
                  {item.isRead ? "Read" : "Mark read"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
