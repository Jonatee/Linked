"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell, Bookmark, Compass, Home, LogOut, PenSquare, Settings, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";
import SquareAvatar from "@/components/branding/square-avatar";
import VerifiedBadge from "@/components/branding/verified-badge";
import api from "@/lib/api";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import { LINKED_LOGO_URL } from "@/lib/brand";
import useAuthStore from "@/stores/auth-store";
import useUiStore from "@/stores/ui-store";

function NotificationMark({ unreadCount }) {
  const value = unreadCount > 99 ? "99+" : String(unreadCount || 0).padStart(2, "0");

  return (
    <div className="relative flex h-9 w-9 items-center justify-center">
      <div className="notification-pulse absolute inset-0 rounded-xl bg-[#201111]" />
      <div className="absolute bottom-[-3px] right-[-3px] h-4 w-4 rounded-[4px] bg-black" />
      <div className="absolute bottom-[-1px] right-[-1px] h-4 w-4 rounded-[4px] bg-accent/85" />
      <span className="editorial-title relative z-10 text-[11px] font-black tracking-[0.08em] text-white">
        {value}
      </span>
    </div>
  );
}

export default function LeftSidebar() {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const openComposer = useUiStore((state) => state.openComposer);
  const isSignedIn = Boolean(currentUser);
  const username = currentUser?.username || null;
  const displayName = currentUser?.usernameDisplay || currentUser?.username || "Guest";
  const initials = (displayName || "LI").slice(0, 2).toUpperCase();
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get("/notifications");
      return response.data.data;
    },
    enabled: Boolean(currentUser)
  });
  const unreadCount = (notificationsQuery.data || []).filter((item) => !item.isRead).length;

  const items = isSignedIn
    ? [
        { href: "/home", label: "Home", icon: Home },
        { href: "/explore", label: "Explore", icon: Compass },
        { href: "/notifications", label: "Notifications", icon: null },
        { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
        { href: username ? `/profile/${username}` : "/home", label: "Profile", icon: User },
        { href: "/settings", label: "Settings", icon: Settings }
      ]
    : [
        { href: "/home", label: "Home", icon: Home },
        { href: "/explore", label: "Explore", icon: Compass },
        { href: "/auth/login", label: "Login", icon: User }
      ];

  if (currentUser?.role === "admin") {
    items.push({ href: "/admin", label: "Admin", icon: Shield });
  }

  if (currentUser?.role === "moderator") {
    items.push({ href: "/moderator", label: "Moderator", icon: Shield });
  }

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Clear local session even if the backend session is already invalid.
    } finally {
      clearSession();
      router.replace("/auth/login");
    }
  }

  function handlePost() {
    if (!isSignedIn) {
      router.push(getLoginRedirectPath("/home"));
      return;
    }

    openComposer();
  }

  return (
    <aside className="hidden h-screen overflow-y-auto border-r border-white/10 bg-[#131313] p-5 lg:flex lg:flex-col lg:overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="px-3">
        <div className="mb-8">
          <Image
            src={LINKED_LOGO_URL}
            alt="LInked"
            width={160}
            height={56}
            className="h-14 w-auto rounded-xl object-contain"
            unoptimized
          />
        </div>
        <div className="mb-8 flex items-center gap-3">
          <SquareAvatar
            initials={initials}
            size="sm"
            src={currentUser?.profile?.avatarMedia?.secureUrl || ""}
            alt={displayName}
          />
          <div>
            <div className="flex items-center gap-2">
              <div className="editorial-title text-sm font-bold text-white">{displayName}</div>
              {currentUser?.isVerified ? <VerifiedBadge compact /> : null}
            </div>
            <div className="text-xs text-muted">@{username || "linked_user"}</div>
          </div>
        </div>
      </div>
      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isNotifications = item.label === "Notifications";
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="hover-lift flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-muted transition hover:bg-[#1c1b1b] hover:text-white"
            >
              {isNotifications ? (
                unreadCount ? <NotificationMark unreadCount={unreadCount} /> : <Bell size={18} />
              ) : (
                <Icon size={18} />
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3">
        <button
          type="button"
          onClick={handlePost}
          className="editorial-title hover-lift flex w-full items-center justify-center rounded-md bg-accent px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(224,36,36,0.18)]"
        >
          <PenSquare size={16} className="mr-2" />
          Post
        </button>
        {isSignedIn ? (
          <button
            type="button"
            onClick={handleLogout}
            className="hover-lift mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-white/10 px-4 py-3 text-sm font-medium text-muted transition hover:bg-[#1c1b1b] hover:text-white"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        ) : null}
      </div>
    </aside>
  );
}
