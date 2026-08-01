"use client";

import { useEffect, useState } from "react";
import { Award, Crown, Medal, Trophy } from "lucide-react";
import type { LeaderboardEntryDto } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoaderBlock } from "@/components/ui/spinner";
import { bloodTypeLabel, cn, initials } from "@/lib/utils";

const rankStyle: Record<number, { icon: typeof Trophy; ring: string }> = {
  1: { icon: Crown, ring: "border-amber-300 bg-amber-50 text-amber-600" },
  2: { icon: Medal, ring: "border-zinc-300 bg-zinc-100 text-zinc-500" },
  3: { icon: Medal, ring: "border-orange-300 bg-orange-50 text-orange-600" },
};

export function LeaderboardView() {
  const [entries, setEntries] = useState<LeaderboardEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const res = await fetch("/api/leaderboard");
        if (!res.ok) throw new Error("Failed to load leaderboard");
        const data = await res.json();
        if (!cancelled) setEntries(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-amber-500" />
          Donor Leaderboard
        </CardTitle>
        <CardDescription>
          Top donors ranked by completed donations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoaderBlock />
        ) : error ? (
          <p className="py-8 text-center text-sm text-red-600">{error}</p>
        ) : entries.length === 0 ? (
          <div className="py-10 text-center">
            <Award className="mx-auto mb-3 size-10 text-zinc-300" />
            <p className="text-sm font-medium text-zinc-700">
              No donors yet
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Completed donations will appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {entries.map((entry, i) => {
              const rank = i + 1;
              const top = rankStyle[rank];
              const RankIcon = top?.icon ?? null;
              return (
                <li
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-3.5 rounded-xl border bg-white p-3.5",
                    top ? top.ring : "border-zinc-100",
                  )}
                >
                  <div className="flex w-8 shrink-0 justify-center">
                    {RankIcon ? (
                      <RankIcon
                        className={cn(
                          "size-6",
                          rank === 1 ? "text-amber-500" : "text-zinc-400",
                        )}
                      />
                    ) : (
                      <span className="text-sm font-bold text-zinc-400">
                        #{rank}
                      </span>
                    )}
                  </div>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-red-600">
                    {initials(entry.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {entry.fullName}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {entry.city ?? "—"}
                      {entry.bloodType && (
                        <span className="ml-2 font-medium text-red-600">
                          {bloodTypeLabel(entry.bloodType)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {entry.badges.slice(0, 3).map((b) => (
                      <span
                        key={b.id}
                        title={b.name}
                        className="text-lg"
                      >
                        {b.iconUrl}
                      </span>
                    ))}
                    {entry.badges.length > 3 && (
                      <Badge tone="zinc">+{entry.badges.length - 3}</Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-zinc-900">
                      {entry.donationCount}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {entry.donationCount === 1 ? "donation" : "donations"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
