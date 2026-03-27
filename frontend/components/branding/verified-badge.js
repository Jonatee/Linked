"use client";

import { Sparkles } from "lucide-react";

export default function VerifiedBadge({ compact = false, className = "" }) {
  if (compact) {
    return (
      <span
        className={`relative inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#f7d774]/70 bg-[linear-gradient(135deg,#fff1a8_0%,#f7c948_42%,#b7791f_100%)] text-[#2a1800] shadow-[0_0_18px_rgba(247,201,72,0.22)] ${className}`}
        title="Verified"
        aria-label="Verified"
      >
        <Sparkles size={10} className="relative z-10" />
        <span className="pointer-events-none absolute inset-y-0 left-[18%] w-[34%] -skew-x-12 rounded-full bg-white/35 blur-[0.5px]" />
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex items-center gap-1 overflow-hidden rounded-full border border-[#f7d774]/60 bg-[linear-gradient(135deg,#fff7bf_0%,#f8d35f_40%,#b77b1d_100%)] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#2d1800] shadow-[0_0_20px_rgba(247,201,72,0.2)] ${className}`}
      title="Verified"
      aria-label="Verified"
    >
      <span className="pointer-events-none absolute inset-y-0 left-[-12%] w-[40%] -skew-x-12 bg-white/35 blur-[0.5px]" />
      <Sparkles size={10} className="relative z-10" />
      <span className="relative z-10">Linked</span>
    </span>
  );
}
