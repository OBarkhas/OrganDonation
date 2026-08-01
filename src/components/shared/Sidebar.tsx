"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface SidebarProps {
  items: SidebarItem[];
  active: string;
  onSelect: (id: string) => void;
}

export function Sidebar({ items, active, onSelect }: SidebarProps) {
  return (
    <aside className="w-full shrink-0 rounded-2xl border border-zinc-200/80 bg-white p-2 shadow-sm lg:w-56">
      <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              aria-pressed={isActive}
              className={cn(
                "flex flex-1 shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all lg:flex-none",
                isActive
                  ? "bg-red-600 text-white shadow-sm shadow-red-600/30"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
