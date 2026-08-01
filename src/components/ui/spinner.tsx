import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-red-600",
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function LoaderBlock({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-16", className)}>
      <Spinner className="size-8" />
    </div>
  );
}
