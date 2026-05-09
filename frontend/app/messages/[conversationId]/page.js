import AppShell from "@/components/layout/app-shell";
import MessagesWorkspace from "@/components/messages/messages-workspace";

export default async function MessageThreadPage({ params }) {
  const resolvedParams = await params;
  const conversationId = resolvedParams?.conversationId || null;

  return (
    <AppShell mainScrollable={false} mainClassName="flex h-screen min-h-0 flex-col overflow-hidden !px-0 !py-0 !pb-0 !pt-0 lg:!px-6 lg:!pb-6 lg:!pt-6">
      <div className="fixed inset-0 z-[60] flex flex-col bg-[#141212] lg:relative lg:inset-auto lg:z-auto lg:h-full lg:min-h-0 lg:w-full lg:overflow-hidden lg:rounded-2xl lg:border lg:border-white/10 lg:shadow-2xl">
        <MessagesWorkspace conversationId={conversationId} layout="thread" />
      </div>
    </AppShell>
  );
}