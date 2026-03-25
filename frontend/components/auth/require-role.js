"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/stores/auth-store";

export default function RequireRole({ roles = [], fallbackPath = "/home", children }) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (!roles.includes(currentUser.role)) {
      router.replace(fallbackPath);
    }
  }, [currentUser, fallbackPath, roles, router]);

  if (!currentUser || !roles.includes(currentUser.role)) {
    return null;
  }

  return children;
}
