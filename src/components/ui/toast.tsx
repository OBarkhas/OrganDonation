"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  message: string;
  onClose: () => void;
  tone?: "success" | "error";
}

export function Toast({ message, onClose, tone = "success" }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-lg",
          tone === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-red-200 bg-red-50 text-red-900",
        )}
      >
        <CheckCircle2
          className={cn(
            "mt-0.5 size-5 shrink-0",
            tone === "success" ? "text-emerald-500" : "text-red-500",
          )}
        />
        <p className="text-sm font-medium leading-snug">{message}</p>
      </div>
    </div>
  );
}
