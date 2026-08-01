"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { HeartPulse } from "lucide-react";
import { NotificationsBell } from "@/components/shared/NotificationsBell";

export function Navbar() {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-600/30 transition group-hover:bg-red-700">
            <HeartPulse className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            LifeBridge
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {isLoaded && isSignedIn ? (
            <>
              <NotificationsBell />
              <span className="flex items-center gap-2">
                {user?.firstName || user?.username ? (
                  <span className="hidden text-sm font-medium text-zinc-700 md:block">
                    {user.firstName ?? user.username}
                  </span>
                ) : null}
                <UserButton />
              </span>
            </>
          ) : (
            <span className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="hidden items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-red-600/30 transition hover:bg-red-700 sm:inline-flex"
              >
                Get Started
              </Link>
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
