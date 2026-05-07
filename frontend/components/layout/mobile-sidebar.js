"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BellRing, Bookmark } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { getLoginRedirectPath } from "@/lib/auth-redirect";
import useAuthStore from "@/stores/auth-store";

function Badge({ count }) {
  if (!count) {
    return null;
  }

  return (
    <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-black text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function MobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const isSignedIn = Boolean(currentUser);
  const isFeedPage = pathname === "/home" || pathname === "/";

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get("/notifications");
      return response.data.data;
    },
    enabled: Boolean(currentUser)
  });

  const unreadNotifications = (notificationsQuery.data || []).filter((item) => !item.isRead).length;
  const notificationsHref = isSignedIn ? "/notifications" : getLoginRedirectPath("/notifications");
  const bookmarksHref = isSignedIn ? "/bookmarks" : getLoginRedirectPath("/bookmarks");
  const notificationsActive = pathname === "/notifications" || pathname?.startsWith("/notifications");
  const bookmarksActive = pathname === "/bookmarks" || pathname?.startsWith("/bookmarks");

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/home");
  }

  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-[#131313]/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3">
        {isFeedPage ? (
          <Link href="/home" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#191717]" aria-label="Linked home">
            <Image src="/linkedicon.png" alt="Linked" width={42} height={42} className="h-full w-full object-cover" priority />
          </Link>
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

        <div className="flex items-center gap-2">
          <Link
            href={bookmarksHref}
            aria-label="Bookmarks"
            className={`relative flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 transition ${
              bookmarksActive ? "border-accent bg-accent/10 text-accent" : "border-white/10 bg-[#191717] text-white hover:border-white/20"
            }`}
          >
            <Bookmark size={18} />
          </Link>

          <Link
            href={notificationsHref}
            aria-label="Notifications"
            className={`relative flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 transition ${
              notificationsActive ? "border-accent bg-accent/10 text-accent" : "border-white/10 bg-[#191717] text-white hover:border-white/20"
            }`}
          >
            <div className="relative">
              <BellRing size={18} />
              <Badge count={unreadNotifications} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
