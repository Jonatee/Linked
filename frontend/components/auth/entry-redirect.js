"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import useAuthStore from "@/stores/auth-store";
import { canAttemptSessionCheck, recordSessionCheckAttempt, resetSessionCheckAttempts } from "@/lib/session-check";
import { getPostAuthRedirectPath } from "@/lib/auth-redirect";

export default function EntryRedirect({ authenticatedPath, unauthenticatedPath = "/auth/login" }) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const token = window.localStorage.getItem("linked_access_token");

      if (!token) {
        clearSession();
        router.replace(unauthenticatedPath);
        return;
      }

      if (!canAttemptSessionCheck()) {
        clearSession();
        router.replace(unauthenticatedPath);
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
        router.replace(authenticatedPath || getPostAuthRedirectPath(response.data.data.user));
      } catch (error) {
        if (!mounted) {
          return;
        }

        clearSession();
        router.replace(unauthenticatedPath);
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, [authenticatedPath, clearSession, router, setSession, unauthenticatedPath]);

  return (
    <main className="subtle-grid flex min-h-screen items-center justify-center">
      <div className="panel p-6 text-sm text-muted">
        Checking your session
        <span className="loading-ellipsis" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </div>
    </main>
  );
}
