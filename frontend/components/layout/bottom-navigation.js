"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Home, LogOut, MessageSquareText, PenSquare, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import useAuthStore from "@/stores/auth-store";
import useUiStore from "@/stores/ui-store";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import api from "@/lib/api";

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const openComposer = useUiStore((state) => state.openComposer);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const { data: convData } = useQuery({
    queryKey: ["messages", "conversations", "nav"],
    queryFn: async () => {
      const response = await api.get("/messages/conversations");
      return response.data.data;
    },
    enabled: Boolean(currentUser)
  });

  const totalUnreadCount = (convData?.items || []).filter((conv) => conv.unreadCount > 0).length || 0;

  const profileHref = currentUser ? `/profile/${currentUser.username}` : getLoginRedirectPath("/home");

  const navItems = [
    {
      href: "/home",
      icon: Home,
      label: "Home",
      isActive: pathname === "/home" || pathname === "/"
    },
    {
      href: "/explore",
      icon: Compass,
      label: "Explore",
      isActive: pathname === "/explore" || pathname?.startsWith("/explore")
    },
    {
      action: "compose",
      icon: PenSquare,
      label: "Post",
      isActive: false
    },
    {
      href: "/messages",
      icon: MessageSquareText,
      label: "Messages",
      isActive: pathname === "/messages" || pathname?.startsWith("/messages")
    }
  ];

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

  function handleCompose() {
    if (!currentUser) {
      router.push(getLoginRedirectPath("/home"));
      return;
    }

    openComposer();
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#131313]/95 backdrop-blur lg:hidden">
      <div className="flex items-end justify-around gap-1 px-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.action === "compose") {
            return (
              <button
                key={item.label}
                type="button"
                onClick={handleCompose}
                className="flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-muted transition hover:text-white"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-accent text-white shadow-[0_14px_28px_rgba(224,36,36,0.2)]">
                  <Icon size={22} />
                </div>
                <span className="text-[10px] font-medium text-white">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition ${
                item.isActive ? "text-accent" : "text-muted hover:text-white"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon size={20} />
                {item.label === "Messages" && totalUnreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white shadow-[0_2px_10px_rgba(224,36,36,0.5)]">
                    {totalUnreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        <div className="relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className={`flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border transition ${
              pathname?.startsWith(`/profile/${currentUser?.username}`) || menuOpen ? "border-accent" : "border-white/10"
            } bg-[#191717]`}
            aria-label="Open profile menu"
          >
            {currentUser?.profile?.avatarMedia?.secureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser.profile.avatarMedia.secureUrl}
                alt={currentUser?.usernameDisplay || currentUser?.username || "Profile"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[9px] font-semibold text-white">
                {(currentUser?.usernameDisplay || currentUser?.username || "LI").slice(0, 2).toUpperCase()}
              </span>
            )}
          </button>
          <span className={`text-[10px] font-medium ${pathname?.startsWith(`/profile/${currentUser?.username}`) ? "text-accent" : "text-muted"}`}>
            Profile
          </span>

          {menuOpen ? (
            <div className="absolute bottom-14 right-0 z-50 w-44 overflow-hidden rounded-[16px] border border-white/10 bg-[#141313] shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
              <Link
                href={profileHref}
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
      </div>
    </nav>
  );
}