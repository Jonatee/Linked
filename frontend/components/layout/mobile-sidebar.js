"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Bookmark, Compass, Home, LogOut, Menu, PenSquare, Settings, Shield, User, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import SquareAvatar from "@/components/branding/square-avatar";
import VerifiedBadge from "@/components/branding/verified-badge";
import api from "@/lib/api";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import useAuthStore from "@/stores/auth-store";
import useUiStore from "@/stores/ui-store";

function NotificationMark({ unreadCount, compact = false }) {
  const value = unreadCount > 99 ? "99+" : String(unreadCount || 0).padStart(2, "0");
  const sizeClass = compact ? "h-8 w-8" : "h-9 w-9";

  return (
    <div className={`relative flex ${sizeClass} items-center justify-center`}>
      <div className="notification-pulse absolute inset-0 rounded-xl bg-[#201111]" />
      <div className="absolute bottom-[-3px] right-[-3px] h-4 w-4 rounded-[4px] bg-black" />
      <div className="absolute bottom-[-1px] right-[-1px] h-4 w-4 rounded-[4px] bg-accent/85" />
      <span className="editorial-title relative z-10 text-[11px] font-black tracking-[0.08em] text-white">
        {value}
      </span>
    </div>
  );
}

export default function MobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
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

  const items = useMemo(() => {
    const nextItems = isSignedIn
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
      nextItems.push({ href: "/admin", label: "Admin", icon: Shield });
    }

    if (currentUser?.role === "moderator") {
      nextItems.push({ href: "/moderator", label: "Moderator", icon: Shield });
    }

    return nextItems;
  }, [currentUser?.role, isSignedIn, username]);

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Clear local session even if the backend session is already invalid.
    } finally {
      setOpen(false);
      clearSession();
      router.replace("/auth/login");
    }
  }

  function handleComposerOpen() {
    setOpen(false);
    if (!isSignedIn) {
      router.push(getLoginRedirectPath(pathname || "/home"));
      return;
    }

    openComposer();
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#131313]/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#191717] text-white"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <div className="editorial-title text-xl font-black text-[#ece7e2]">LInked</div>
          <button
            type="button"
            onClick={handleComposerOpen}
            className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white"
          >
            <PenSquare size={14} />
            Post
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation backdrop"
            onClick={() => setOpen(false)}
            className="overlay-fade absolute inset-0 bg-black/55 backdrop-blur-sm"
          />

          <aside className="panel-reveal relative flex h-full w-[86%] max-w-[320px] flex-col border-r border-white/10 bg-[#131313] p-5 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <SquareAvatar
                  initials={initials}
                  size="sm"
                  src={currentUser?.profile?.avatarMedia?.secureUrl || ""}
                  alt={displayName}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="editorial-title truncate text-sm font-bold text-white">{displayName}</div>
                    {currentUser?.isVerified ? <VerifiedBadge compact className="shrink-0" /> : null}
                  </div>
                  <div className="truncate text-xs text-muted">@{username || "linked_user"}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#191717] text-white"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="space-y-2">
              {items.map((item) => {
                const Icon = item.icon;
                const isNotifications = item.label === "Notifications";
                const isActive =
                  pathname === item.href || (item.href !== "/home" && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`hover-lift flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                      isActive ? "bg-[#1f1a1a] text-white" : "text-muted hover:bg-[#1c1b1b] hover:text-white"
                    }`}
                  >
                    {isNotifications ? (
                      unreadCount ? <NotificationMark unreadCount={unreadCount} compact /> : <Bell size={18} />
                    ) : (
                      <Icon size={18} />
                    )}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto space-y-3 pt-6">
              <button
                type="button"
                onClick={handleComposerOpen}
                className="editorial-title hover-lift flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(224,36,36,0.18)]"
              >
                <PenSquare size={16} className="mr-2" />
                Post
              </button>
              {isSignedIn ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hover-lift flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-muted transition hover:bg-[#1c1b1b] hover:text-white"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
