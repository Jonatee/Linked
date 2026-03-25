"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ExploreHeader() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const query = value.trim();

    if (!query) {
      return;
    }

    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  return (
    <section className="panel p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Search size={20} />
        </div>
        <div>
          <div className="editorial-title text-3xl font-black text-white">Explore</div>
          <p className="mt-2 text-sm text-muted">Discover trending conversations, creators, and tags.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 md:flex-row">
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search users, posts, and tags from Explore"
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </form>
    </section>
  );
}
