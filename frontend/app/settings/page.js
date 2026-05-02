import AppShell from "@/components/layout/app-shell";
import SettingsForm from "@/components/data/settings-form";
import BackButton from "@/components/navigation/back-button";

export default function SettingsPage() {
  return (
    <AppShell>
      <BackButton className="hidden lg:inline-flex" />
      <SettingsForm />
    </AppShell>
  );
}
