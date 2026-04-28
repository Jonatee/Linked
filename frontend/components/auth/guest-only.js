"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { canAttemptSessionCheck, recordSessionCheckAttempt, resetSessionCheckAttempts } from "@/lib/session-check";
import { getPostAuthRedirectPath } from "@/lib/auth-redirect";

export default function GuestOnly({ children }) {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function check() {
      const token = window.localStorage.getItem("linked_access_token");

      if (!token) {
        return;
      }

      if (!canAttemptSessionCheck()) {
        return;
      }

      try {
        recordSessionCheckAttempt();
        const response = await api.get("/auth/me");
        if (mounted) {
          resetSessionCheckAttempts();
          router.replace(getPostAuthRedirectPath(response.data.data.user));
        }
      } catch (error) {
        // Stay on guest pages silently when the saved session is invalid.
      }
    }

    check();

    return () => {
      mounted = false;
    };
  }, [router]);

  return children;
}
