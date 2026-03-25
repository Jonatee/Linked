"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import useAuthStore from "@/stores/auth-store";
import GuestOnly from "@/components/auth/guest-only";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetSessionCheckAttempts } from "@/lib/session-check";
import { getPostAuthRedirectPath } from "@/lib/auth-redirect";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm({
    defaultValues: {
      email: searchParams.get("email") || "",
      code: ""
    }
  });

  async function onSubmit(values) {
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
          {searchParams.get("email") ? (
            <p className="mt-2 text-xs text-muted">We sent a fresh code to {searchParams.get("email")}.</p>
          ) : null}
          <div className="mt-6 grid gap-4">
            <Input type="email" placeholder="Email" {...form.register("email", { required: true })} />
            <Input placeholder="6-digit code" maxLength={6} {...form.register("code", { required: true })} />
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
