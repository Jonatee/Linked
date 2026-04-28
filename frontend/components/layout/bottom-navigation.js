"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Bookmark, Compass, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import useAuthStore from "@/stores/auth-store";
import api from "@/lib/api";

function NotificationMark({ unreadCount }) {
  const value = unreadCount > 99 ? "99+" : String(unreadCount || 0).padStart(2, "0");

  return (
    <div className="relative flex h-6 w-6 items-center justify-center">
      <div className="notification-pulse absolute inset-0 rounded-lg bg-[#201111]" />
      <div className="absolute bottom-[-2px] right-[-2px] h-3 w-3 rounded-[3px] bg-black" />
      <div className="absolute bottom-[-1px] right-[-1px] h-3 w-3 rounded-[3px] bg-accent/85" />
      <span className="editorial-title relative z-10 text-[9px] font-black tracking-[0.08em] text-white">
        {value}
      </span>
    </div>
  );
}

export default function BottomNavigation() {
  const pathname = usePathname();
  const currentUser = useAuthStore((state) => state.currentUser);

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await api.get("/notifications");
      return response.data.data;
    },
    enabled: Boolean(currentUser)
  });

  const unreadCount = (notificationsQuery.data || []).filter((item) => !item.isRead).length;

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
      href: "/notifications",
      icon: Bell,
      label: "Notifications", 
      isActive: pathname === "/notifications" || pathname?.startsWith("/notifications"),
      hasNotification: unreadCount > 0
    },
    {
      href: "/bookmarks",
      icon: Bookmark, 
      label: "Bookmarks",
      isActive: pathname === "/bookmarks" || pathname?.startsWith("/bookmarks")
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#131313]/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition ${
                item.isActive 
                  ? "text-accent" 
                  : "text-muted hover:text-white"
              }`}
            >
              <div className="relative">
                {item.hasNotification ? (
                  <NotificationMark unreadCount={unreadCount} />
                ) : (
                  <Icon size={20} />
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}