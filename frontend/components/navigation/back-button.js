"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton({ label = "Back", fallback = "/home", showLabel = false }) {
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
      aria-label={label}
      className={`sticky top-4 z-40 inline-flex items-center rounded-xl border border-white/10 bg-[#1b1919] py-2 text-sm font-medium text-muted shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition hover:bg-[#211d1d] hover:text-white ${
        showLabel ? "gap-2 px-4" : "justify-center px-3"
      }`}
    >
      <ArrowLeft size={16} />
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </button>
  );
}
