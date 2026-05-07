import AppShell from "@/components/layout/app-shell";
import MessagesWorkspace from "@/components/messages/messages-workspace";
import { MessageSquareText } from "lucide-react";

export default function MessagesPage() {
  return (
    <AppShell mainScrollable={false} mainClassName="flex h-screen min-h-0 flex-col gap-6 overflow-hidden space-y-0">
      <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
        <section className="panel p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <MessageSquareText size={20} />
            </div>
            <div>
              <div className="editorial-title text-3xl font-black text-white">Messages</div>
              <p className="mt-1 text-sm text-muted">Your inbox and conversation list.</p>
            </div>
          </div>
        </section>
        <div className="flex-1 min-h-0">
          <MessagesWorkspace layout="inbox" />
        </div>
      </div>
    </AppShell>
  );
}