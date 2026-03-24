import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-md border-none bg-[#0e0e0e] px-4 py-3 text-sm text-[#ece7e2] outline-none transition placeholder:text-[#5d5a57] focus:ring-2 focus:ring-accent/30",
        className
      )}
      {...props}
    />
  );
});
