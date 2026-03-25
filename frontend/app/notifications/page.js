import AppShell from "@/components/layout/app-shell";
import NotificationsData from "@/components/data/notifications-data";
import BackButton from "@/components/navigation/back-button";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <AppShell>
      <BackButton />
      <section className="panel p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Bell size={20} />
          </div>
          <div className="editorial-title text-3xl font-black text-white">Notifications</div>
        </div>
        <p className="mt-2 text-sm text-muted">Follow events, replies, moderation updates, and mentions.</p>
      </section>
      <NotificationsData />
    </AppShell>
  );
}
