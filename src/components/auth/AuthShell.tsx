import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden bg-gradient-to-b from-red-50 via-white to-white px-4 py-10">
      <div className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-red-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 size-72 rounded-full bg-rose-200/40 blur-3xl" />

      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
