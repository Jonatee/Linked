"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { canAttemptSessionCheck, recordSessionCheckAttempt, resetSessionCheckAttempts } from "@/lib/session-check";

export default function GuestOnly({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const token = window.localStorage.getItem("linked_access_token");

      if (!token) {
        setReady(true);
        return;
      }

      if (!canAttemptSessionCheck()) {
        setReady(true);
        return;
      }

      try {
        recordSessionCheckAttempt();
        await api.get("/auth/me");
        if (mounted) {
          resetSessionCheckAttempts();
          router.replace("/home");
        }
      } catch (error) {
        if (mounted) {
          setReady(true);
        }
      }
    }

    check();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <main className="subtle-grid flex min-h-screen items-center justify-center">
        <div className="panel p-6 text-sm text-muted">Checking your session...</div>
      </main>
    );
  }

  return children;
}
