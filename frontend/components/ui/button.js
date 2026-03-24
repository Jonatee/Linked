"use client";

import { cn } from "@/lib/utils";

export function Button({ className, variant = "primary", ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition active:scale-[0.98]",
        variant === "primary" &&
          "editorial-title bg-accent text-white shadow-[0_12px_24px_rgba(224,36,36,0.18)] hover:brightness-110",
        variant === "secondary" &&
          "border border-white/15 bg-[#201f1f] text-[#ece7e2] hover:bg-[#2a2a2a]",
        variant === "ghost" && "text-muted hover:bg-white/5 hover:text-white",
        className
      )}
      {...props}
    />
  );
}
