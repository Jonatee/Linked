"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SquareAvatar from "@/components/branding/square-avatar";
import api from "@/lib/api";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import useAuthStore from "@/stores/auth-store";
import useUiStore from "@/stores/ui-store";

export default function MobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const openComposer = useUiStore((state) => state.openComposer);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isSignedIn = Boolean(currentUser);
  const username = currentUser?.username || null;
  const displayName = currentUser?.usernameDisplay || currentUser?.username || "Guest";
  const initials = (displayName || "LI").slice(0, 2).toUpperCase();

  const isOnOwnProfile = isSignedIn && pathname?.startsWith(`/profile/${username}`);

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

  function handleComposerOpen() {
    if (!isSignedIn) {
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
    <div className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#131313]/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3">
        {isSignedIn ? (
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
        )}

        <Link href="/home" className="editorial-title text-xl font-black text-[#ece7e2] transition hover:text-white">
          LInked
        </Link>

        <button
          type="button"
          onClick={handleComposerOpen}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-accent/90"
        >
          <span className="inline-flex h-4 w-4 items-center justify-center text-[14px] leading-none">+</span>
          Post
        </button>
      </div>
    </div>
  );
}
