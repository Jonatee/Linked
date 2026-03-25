"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton({ label = "Back", fallback = "/home" }) {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#1b1919] px-4 py-2 text-sm font-medium text-muted transition hover:bg-[#211d1d] hover:text-white"
    >
      <ArrowLeft size={16} />
      <span>{label}</span>
    </button>
  );
}
