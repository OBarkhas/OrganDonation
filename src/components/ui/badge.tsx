import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tone = "red" | "green" | "amber" | "blue" | "violet" | "zinc";

const toneClasses: Record<Tone, string> = {
  red: "bg-red-100 text-red-700 border-red-200",
  green: "bg-emerald-100 text-emerald-700 border-emerald-200",
  amber: "bg-amber-100 text-amber-700 border-amber-200",
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  violet: "bg-violet-100 text-violet-700 border-violet-200",
  zinc: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "zinc", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
