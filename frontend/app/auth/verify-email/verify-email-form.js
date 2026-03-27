"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import useAuthStore from "@/stores/auth-store";
import GuestOnly from "@/components/auth/guest-only";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetSessionCheckAttempts } from "@/lib/session-check";
import { getPostAuthRedirectPath } from "@/lib/auth-redirect";

export default function VerifyEmailForm({ initialEmail = "" }) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [submitError, setSubmitError] = useState("");
  const form = useForm({
    defaultValues: {
      email: initialEmail,
      code: ""
    }
  });

  async function onSubmit(values) {
    setSubmitError("");

    try {
      const response = await api.post("/auth/verify-email", values);
      resetSessionCheckAttempts();
      const accessToken = response.data.data.accessToken;
      setSession({
        accessToken,
        user: response.data.data.user
      });

      const meResponse = await api.get("/auth/me");
      const user = {
        ...meResponse.data.data.user,
        profile: meResponse.data.data.profile || null
      };

      setSession({
        accessToken,
        user
      });
      router.push(getPostAuthRedirectPath(user));
    } catch (error) {
      setSubmitError(error?.response?.data?.message || "Verification failed. Please try again.");
    }
  }

  return (
    <GuestOnly>
      <main className="subtle-grid mx-auto flex min-h-screen items-center justify-center px-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="panel w-full max-w-md p-8">
          <div className="mb-2 text-xs uppercase tracking-[0.3em] text-muted">Email verification</div>
          <div className="editorial-title text-3xl font-black text-white">Verify your LInked account</div>
          <p className="mt-3 text-sm text-muted">
            Enter the six-digit code sent to your email to complete registration.
          </p>
          {initialEmail ? <p className="mt-2 text-xs text-muted">We sent a fresh code to {initialEmail}.</p> : null}
          <div className="mt-6 grid gap-4">
            <Input type="email" placeholder="Email" {...form.register("email", { required: true })} />
            <Input placeholder="6-digit code" maxLength={6} {...form.register("code", { required: true })} />
            {submitError ? <p className="text-sm text-accent">{submitError}</p> : null}
            <Button type="submit" loading={form.formState.isSubmitting}>
              Verify email
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted">
            Need to start over? <Link href="/auth/register" className="text-accent">Register again</Link>
          </p>
        </form>
      </main>
    </GuestOnly>
  );
}
