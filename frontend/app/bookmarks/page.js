import AppShell from "@/components/layout/app-shell";
import BookmarksView from "@/components/data/bookmarks-view";
import BackButton from "@/components/navigation/back-button";

export default function BookmarksPage() {
  return (
    <AppShell>
      <BackButton />
      <BookmarksView />
    </AppShell>
  );
}
