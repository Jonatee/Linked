import { cn } from "@/lib/utils";

export default function SquareAvatar({ src, alt, size = "md", initials = "LI", className, onClick }) {
  const sizes = {
    sm: "h-10 w-10 text-xs",
    md: "h-14 w-14 text-sm",
    lg: "h-20 w-20 text-lg"
  };

  return (
    <div
      className={cn("accent-frame inline-block", onClick ? "cursor-pointer" : "", className)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-accentDark text-white",
          sizes[size]
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    </div>
  );
}
