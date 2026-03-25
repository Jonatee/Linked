import AppShell from "@/components/layout/app-shell";
import SearchResults from "@/components/data/search-results";
import BackButton from "@/components/navigation/back-button";
import { Search } from "lucide-react";

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q || "";

  return (
    <AppShell>
      <BackButton />
      <section className="panel p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Search size={20} />
          </div>
          <div className="text-3xl font-black tracking-tight">Search</div>
        </div>
        <p className="mt-2 text-sm text-muted">Results across users, posts, and hashtag clusters.</p>
      </section>
      <SearchResults query={query} />
    </AppShell>
  );
}
