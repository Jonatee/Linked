"use client";

import Link from "next/link";
import { ArrowLeft, BellRing, LogOut, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import SquareAvatar from "@/components/branding/square-avatar";
import api from "@/lib/api";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import useAuthStore from "@/stores/auth-store";

export default function MobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isSignedIn = Boolean(currentUser);
  const username = currentUser?.username || null;
  const displayName = currentUser?.usernameDisplay || currentUser?.username || "Guest";
  const initials = (displayName || "LI").slice(0, 2).toUpperCase();
  const isFeedPage = pathname === "/home" || pathname === "/";
  const isOnOwnProfile = isSignedIn && pathname?.startsWith(`/profile/${username}`);

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get("/notifications");
      return response.data.data;
    },
    enabled: Boolean(currentUser)
  });

  const unreadCount = (notificationsQuery.data || []).filter((item) => !item.isRead).length;
  const notificationsHref = isSignedIn ? "/notifications" : getLoginRedirectPath("/notifications");
  const notificationsActive = pathname === "/notifications" || pathname?.startsWith("/notifications");

  useEffect(() => {
    function handleClickOutside(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/home");
  }

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      // Clear local session even if backend session is already invalid.
    } finally {
      clearSession();
      setMenuOpen(false);
      router.replace("/auth/login");
    }
  }

  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#131313]/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3">
        {isFeedPage ? (
          isSignedIn ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((value) => !value)}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                  isOnOwnProfile || menuOpen
                    ? "border-accent bg-accent/10"
                    : "border-white/10 bg-[#191717] hover:border-white/20"
                }`}
                aria-label="Open profile menu"
              >
                <SquareAvatar
                  initials={initials}
                  size="sm"
                  src={currentUser?.profile?.avatarMedia?.secureUrl || ""}
                  alt={displayName}
                  className="h-8 w-8"
                />
              </button>
              {menuOpen ? (
                <div className="absolute left-0 top-14 z-50 min-w-[180px] overflow-hidden rounded-[18px] border border-white/10 bg-[#141313] shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                  <Link
                    href={`/profile/${username}`}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-[#ece7e2] transition hover:bg-white/5"
                  >
                    <User size={15} />
                    <span>Profile</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-accent transition hover:bg-accent/10"
                  >
                    <LogOut size={15} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#191717] text-white transition hover:border-white/20"
            >
              <span className="text-sm font-bold">LI</span>
            </Link>
          )
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#191717] text-white transition hover:border-white/20"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
        )}

        <Link href="/home" className="editorial-title text-xl font-black text-[#ece7e2] transition hover:text-white">
          LInked
        </Link>

        <Link
          href={notificationsHref}
          aria-label="Notifications"
          className={`relative flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 transition ${
            notificationsActive
              ? "border-accent bg-accent/10 text-accent"
              : "border-white/10 bg-[#191717] text-white hover:border-white/20"
          }`}
        >
          <div className="relative">
            <BellRing size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-black text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
