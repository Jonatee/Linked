"use client";

import { Button } from "@/components/ui/button";

export default function ActionButton({ icon: Icon, label, count, onClick, active = false }) {
  return (
    <Button variant="ghost" onClick={onClick} className={`gap-2 px-0 py-0 text-xs ${active ? "text-accent" : "text-muted"}`}>
      <Icon size={16} fill={active ? "currentColor" : "none"} />
      <span>{label}</span>
      {typeof count === "number" ? <span>{count}</span> : null}
    </Button>
  );
}
