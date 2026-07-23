import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Standard loading state (D6 §20–21). Use while data is in flight. */
export function LoadingState({
  message = "Loading…",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
