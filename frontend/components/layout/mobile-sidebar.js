"use client";

import Link from "next/link";
import { PenSquare } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import SquareAvatar from "@/components/branding/square-avatar";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import useAuthStore from "@/stores/auth-store";
import useUiStore from "@/stores/ui-store";

export default function MobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const openComposer = useUiStore((state) => state.openComposer);
  const isSignedIn = Boolean(currentUser);
  const username = currentUser?.username || null;
  const displayName = currentUser?.usernameDisplay || currentUser?.username || "Guest";
  const initials = (displayName || "LI").slice(0, 2).toUpperCase();
  
  // Check if we're on the current user's profile
  const isOnOwnProfile = isSignedIn && pathname?.startsWith(`/profile/${username}`);

  function handleComposerOpen() {
    if (!isSignedIn) {
      router.push(getLoginRedirectPath("/home"));
      return;
    }
    openComposer();
  }

  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#131313]/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3">
        {/* Profile Avatar - Navigate to profile */}
        {isSignedIn ? (
          <Link
            href={`/profile/${username}`}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
              isOnOwnProfile 
                ? "border-accent bg-accent/10" 
                : "border-white/10 bg-[#191717] hover:border-white/20"
            }`}
          >
            <SquareAvatar
              initials={initials}
              size="sm"
              src={currentUser?.profile?.avatarMedia?.secureUrl || ""}
              alt={displayName}
              className="h-8 w-8"
            />
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#191717] text-white transition hover:border-white/20"
          >
            <span className="text-sm font-bold">LI</span>
          </Link>
        )}
        
        {/* App Title */}
        <Link href="/home" className="editorial-title text-xl font-black text-[#ece7e2] hover:text-white transition">
          LInked
        </Link>
        
        {/* Compose Button */}
        <button
          type="button"
          onClick={handleComposerOpen}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-accent/90"
        >
          <PenSquare size={14} />
          Post
        </button>
      </div>
    </div>
  );
}
