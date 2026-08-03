"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, CheckCheck, X } from "lucide-react";
import type { NotificationDto } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) throw new Error("Failed to load notifications");
        const data = await res.json();
        if (!cancelled) setNotifications(data);
      } catch {}
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    const res = await fetch("/api/notifications", { method: "PATCH" });
    if (res.ok) {
      setNotifications((ns) => ns.map((n) => ({ ...n, isRead: true })));
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications (${unreadCount} unread)`}
        className={cn(
          "relative flex size-9 items-center justify-center rounded-xl transition",
          open
            ? "bg-zinc-100 text-zinc-900"
            : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        )}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-full right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] animate-in zoom-in-95 origin-top-right overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xl shadow-zinc-900/10 sm:w-96"
        >
          <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Notifications
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
              className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="max-h-[400px] overflow-y-auto px-4 py-3">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <BellRing className="mx-auto mb-3 size-10 text-zinc-300" />
                <p className="text-sm font-medium text-zinc-700">
                  No notifications yet
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Updates about your donations will appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="rounded-xl border border-zinc-100 bg-white p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900">
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-red-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{n.message}</p>
                    <p className="mt-1.5 text-xs text-zinc-400">
                      {timeAgo(n.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {unreadCount > 0 && (
            <div className="flex justify-end border-t border-zinc-100 px-4 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void markAllRead()}
              >
                <CheckCheck className="size-3.5" />
                Mark all as read
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
