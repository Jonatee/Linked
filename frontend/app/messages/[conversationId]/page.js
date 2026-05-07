import AppShell from "@/components/layout/app-shell";
import MessagesWorkspace from "@/components/messages/messages-workspace";

export default async function MessageThreadPage({ params }) {
  const resolvedParams = await params;
  const conversationId = resolvedParams?.conversationId || null;

  return (
    <AppShell mainScrollable={false} mainClassName="flex h-screen min-h-0 flex-col gap-6 overflow-hidden space-y-0">
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <MessagesWorkspace conversationId={conversationId} layout="thread" />
      </div>
    </AppShell>
  );
}