"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import GuestOnly from "@/components/auth/guest-only";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

export default function ResetPasswordForm({ initialEmail = "" }) {
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      email: initialEmail,
      code: "",
      password: "",
      confirmPassword: ""
    }
  });

  async function onSubmit(values) {
    await api.post("/auth/reset-password", {
      email: values.email,
      code: values.code,
      password: values.password
    });
    router.push("/auth/login");
  }

  return (
    <GuestOnly>
      <main className="subtle-grid mx-auto flex min-h-screen items-center justify-center px-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="panel w-full max-w-md p-8">
          <div className="mb-2 text-xs uppercase tracking-[0.3em] text-muted">Reset password</div>
          <div className="editorial-title text-3xl font-black text-white">Choose a new password</div>
          <p className="mt-3 text-sm text-muted">
            Enter the reset code from your email, then set your new password.
          </p>
          <div className="mt-6 grid gap-4">
            <Input type="email" placeholder="Email" {...form.register("email", { required: true })} />
            <Input placeholder="6-digit code" maxLength={6} {...form.register("code", { required: true })} />
            <PasswordInput placeholder="New password" {...form.register("password", { required: true })} />
            <PasswordInput
              placeholder="Confirm new password"
              {...form.register("confirmPassword", {
                required: true,
                validate: (value) => value === form.getValues("password") || "Passwords do not match"
              })}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="text-xs text-accent">{form.formState.errors.confirmPassword.message}</p>
            ) : null}
            <Button type="submit" loading={form.formState.isSubmitting}>
              Reset password
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
