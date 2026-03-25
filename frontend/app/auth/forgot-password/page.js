"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import GuestOnly from "@/components/auth/guest-only";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      email: ""
    }
  });

  async function onSubmit(values) {
    await api.post("/auth/forgot-password", values);
    router.push(`/auth/reset-password?email=${encodeURIComponent(values.email)}`);
  }

  return (
    <GuestOnly>
      <main className="subtle-grid mx-auto flex min-h-screen items-center justify-center px-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="panel w-full max-w-md p-8">
          <div className="mb-2 text-xs uppercase tracking-[0.3em] text-muted">Account recovery</div>
          <div className="editorial-title text-3xl font-black text-white">Forgot your password?</div>
          <p className="mt-3 text-sm text-muted">
            Enter your email and we&apos;ll send a time-based code to reset your password.
          </p>
          <div className="mt-6 grid gap-4">
            <Input type="email" placeholder="Email" {...form.register("email", { required: true })} />
            <Button type="submit" loading={form.formState.isSubmitting}>
              Send reset code
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted">
            Back to <Link href="/auth/login" className="text-accent">Login</Link>
          </p>
        </form>
      </main>
    </GuestOnly>
  );
}
