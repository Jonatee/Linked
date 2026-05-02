"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  AtSign,
  Bell,
  CheckCheck,
  Heart,
  MessageCircle,
  Repeat2,
  UserPlus
} from "lucide-react";
import SquareAvatar from "@/components/branding/square-avatar";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";

function getNotificationIcon(type) {
  switch (type) {
    case "follow":
      return UserPlus;
    case "like":
    case "like_post":
    case "like_comment":
      return Heart;
    case "comment":
    case "reply":
      return MessageCircle;
    case "repost":
    case "new_post":
      return Repeat2;
    case "mention":
      return AtSign;
    default:
      return Bell;
  }
}

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
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Bell size={18} />
          </div>
          <div>
            <div className="editorial-title text-sm font-bold text-white">Unread</div>
            <div className="text-xs text-muted">{unreadCount} notifications waiting</div>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={() => markAllMutation.mutate()}
          disabled={!unreadCount || markAllMutation.isPending}
          loading={markAllMutation.isPending}
          className={`h-9 px-3 text-[11px] uppercase tracking-[0.14em] ${!unreadCount ? "cursor-not-allowed opacity-50" : ""}`}
        >
          <CheckCheck size={14} className="mr-1" />
          Mark All
        </Button>
      </div>

      {items.map((item) => {
        const TypeIcon = getNotificationIcon(item.type);

        return (
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
            className={`panel panel-reveal hover-lift w-full p-4 text-left transition hover:bg-[#1a1818] ${!item.isRead ? "border border-accent/35" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div className="relative shrink-0">
                <SquareAvatar
                  initials={item.actor.initials}
                  src={item.actor.avatarUrl}
                  alt={item.actor.name}
                  size="sm"
                />
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#120f0f] bg-[#201616] text-accent">
                  <TypeIcon size={12} />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {item.actor.username ? (
                      <Link
                        href={`/profile/${item.actor.username}`}
                        onClick={(event) => event.stopPropagation()}
                        className="editorial-title text-sm font-bold text-white transition hover:text-accent"
                      >
                        {item.actor.name}
                      </Link>
                    ) : (
                      <div className="editorial-title text-sm font-bold text-white">{item.actor.name}</div>
                    )}
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
        );
      })}
    </div>
  );
}
