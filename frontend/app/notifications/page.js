import AppShell from "@/components/layout/app-shell";
import NotificationsData from "@/components/data/notifications-data";

export default function NotificationsPage() {
  return (
    <AppShell>
      <section className="panel p-6">
        <div className="editorial-title text-3xl font-black text-white">Notifications</div>
        <p className="mt-2 text-sm text-muted">Follow events, replies, moderation updates, and mentions.</p>
      </section>
      <NotificationsData />
    </AppShell>
  );
}
