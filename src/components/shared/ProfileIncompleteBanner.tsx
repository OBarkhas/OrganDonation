"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

export function ProfileIncompleteBanner() {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <p className="text-sm text-amber-800">
          To donate or create a request, please complete your profile details
          (Blood type, phone, city).
        </p>
      </div>
      <Link
        href="/onboarding"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
      >
        Complete Profile
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
