"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import useAuthStore from "@/stores/auth-store";
import { canAttemptSessionCheck, recordSessionCheckAttempt, resetSessionCheckAttempts } from "@/lib/session-check";

export default function RequireAuth({ children, enabled = true }) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.currentUser);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const token = window.localStorage.getItem("linked_access_token");

      if (!enabled) {
        setReady(true);
        return;
      }

      if (!token) {
        clearSession();
        router.replace("/auth/login");
        return;
      }

      if (currentUser) {
        setReady(true);
        return;
      }

      if (!canAttemptSessionCheck()) {
        clearSession();
        router.replace("/auth/login");
        return;
      }

      try {
        recordSessionCheckAttempt();
        const response = await api.get("/auth/me");
        if (!mounted) {
          return;
        }

        resetSessionCheckAttempts();
        setSession({
          accessToken: token,
          user: {
            ...response.data.data.user,
            profile: response.data.data.profile || null
          }
        });
        setReady(true);
      } catch (error) {
        if (!mounted) {
          return;
        }

        clearSession();
        router.replace("/auth/login");
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [clearSession, currentUser, enabled, router, setSession]);

  // Show children immediately, let session check happen in background
  // Only redirect if auth is required and we definitively know user is not authenticated
  if (enabled && !ready && !currentUser) {
    // Return null to show nothing while checking, or return children to show content immediately
    return children; // Show content immediately, auth check happens in background
  }

  return children;
}
