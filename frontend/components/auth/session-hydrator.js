"use client";

import { useEffect } from "react";
import api from "@/lib/api";
import useAuthStore from "@/stores/auth-store";
import { canAttemptSessionCheck, recordSessionCheckAttempt, resetSessionCheckAttempts } from "@/lib/session-check";

export default function SessionHydrator() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      const token =
        typeof window !== "undefined" ? window.localStorage.getItem("linked_access_token") : null;

      if (!token || (currentUser && currentUser.profile)) {
        return;
      }

      if (!canAttemptSessionCheck()) {
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
      } catch (error) {
        if (!mounted) {
          return;
        }

        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          clearSession();
        }
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, [clearSession, currentUser, setSession]);

  return null;
}
