import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-md border-none bg-[#0e0e0e] px-4 py-3 text-sm text-[#ece7e2] outline-none transition placeholder:text-[#5d5a57] focus:ring-2 focus:ring-accent/30 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
      {...props}
    />
  );
});
