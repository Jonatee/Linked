"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import FeedList from "@/components/data/feed-list";

export default function HomePage() {
  return (
    <AppShell requireAuth={false}>
      <section className="panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="editorial-title text-3xl font-black text-white">Home</div>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Followed posts, reposts, and your own updates flow through here first.
            </p>
          </div>
          <Link
            href="/home"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#191717] text-muted transition hover:border-white/20 hover:text-white"
            title="Refresh feed"
          >
            <RefreshCw size={16} />
          </Link>
        </div>
      </section>
      <FeedList queryKey={["feed"]} endpoint="/posts/feed" emptyMessage="Your home feed is empty." />
    </AppShell>
  );
}
