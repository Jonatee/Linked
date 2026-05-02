"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Bookmark, Compass, PenSquare } from "lucide-react";
import useAuthStore from "@/stores/auth-store";
import useUiStore from "@/stores/ui-store";
import { getLoginRedirectPath } from "@/lib/auth-redirect";

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const openComposer = useUiStore((state) => state.openComposer);

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
      href: "/bookmarks",
      icon: Bookmark,
      label: "Bookmarks",
      isActive: pathname === "/bookmarks" || pathname?.startsWith("/bookmarks")
    }
  ];

  function handleCompose() {
    if (!currentUser) {
      router.push(getLoginRedirectPath("/home"));
      return;
    }

    openComposer();
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#131313]/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.action === "compose") {
            return (
              <button
                key={item.label}
                type="button"
                onClick={handleCompose}
                className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-muted transition hover:text-white"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-white shadow-[0_12px_24px_rgba(224,36,36,0.18)]">
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-medium text-white">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition ${
                item.isActive ? "text-accent" : "text-muted hover:text-white"
              }`}
            >
              <div className="relative">
                <Icon size={20} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
