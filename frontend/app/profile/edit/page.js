import AppShell from "@/components/layout/app-shell";
import SettingsForm from "@/components/data/settings-form";
import BackButton from "@/components/navigation/back-button";

export default function EditProfilePage() {
  return (
    <AppShell>
      <BackButton />
      <SettingsForm />
    </AppShell>
  );
}
