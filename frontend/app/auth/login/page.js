"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import useAuthStore from "@/stores/auth-store";
import GuestOnly from "@/components/auth/guest-only";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetSessionCheckAttempts } from "@/lib/session-check";
import { getPostAuthRedirectPath } from "@/lib/auth-redirect";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm({
    defaultValues: {
      identity: "",
      password: ""
    }
  });

  async function onSubmit(values) {
    const response = await api.post("/auth/login", values);
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
          <div className="mb-2 text-xs uppercase tracking-[0.3em] text-muted">The network for curators of signal</div>
          <div className="editorial-title text-3xl font-black text-white">Log in to LInked</div>
          <div className="mt-6 grid gap-4">
            <Input placeholder="Email or username" {...form.register("identity", { required: true })} />
            <Input type="password" placeholder="Password" {...form.register("password", { required: true })} />
            <Button type="submit">Login</Button>
          </div>
          <p className="mt-4 text-sm text-muted">
            Need an account? <Link href="/auth/register" className="text-accent">Register</Link>
          </p>
        </form>
      </main>
    </GuestOnly>
  );
}
