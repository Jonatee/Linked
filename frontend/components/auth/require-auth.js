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
      const token = typeof window !== "undefined" ? window.localStorage.getItem("linked_access_token") : null;

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
        setReady(true);
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

        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          clearSession();
          router.replace("/auth/login");
          return;
        }

        setReady(true);
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [clearSession, currentUser, enabled, router, setSession]);

  if (enabled && !ready && !currentUser) {
    return children;
  }

  return children;
}
