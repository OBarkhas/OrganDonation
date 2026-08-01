"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Bell,
  CalendarDays,
  Droplets,
  History,
  Home,
  Siren,
  Trophy,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoaderBlock } from "@/components/ui/spinner";
import { Toast } from "@/components/ui/toast";
import { Sidebar } from "@/components/shared/Sidebar";
import { ProfileIncompleteBanner } from "@/components/shared/ProfileIncompleteBanner";
import { DonationHistory } from "@/components/donor/DonationHistory";
import { DonationDetailsModal } from "@/components/donor/DonationDetailsModal";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { ProfileView } from "@/components/profile/ProfileView";
import {
  bloodTypeLabel,
  cn,
  donationTypeLabel,
  timeAgo,
  type RequestDto,
  type UserDto,
} from "@/lib/utils";

type UserPayload = UserDto & { donationCount?: number; badgeCount?: number };

const sidebarItems = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "history", label: "Donation History", icon: History },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "profile", label: "My Profile & Settings", icon: UserRound },
];

export function DonorHomeView({ user }: { user: UserDto }) {
  const [profile, setProfile] = useState<UserPayload | null>(null);
  const [requests, setRequests] = useState<RequestDto[]>([]);
  const [active, setActive] = useState("overview");
  const [toggling, setToggling] = useState(false);
  const [daysSince, setDaysSince] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestDto | null>(
    null,
  );
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const [userRes, requestsRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/requests"),
        ]);
        if (!userRes.ok) throw new Error("Failed to load profile");
        const [profileData, requestsData] = await Promise.all([
          userRes.json() as Promise<UserPayload>,
          requestsRes.ok
            ? (requestsRes.json() as Promise<RequestDto[]>)
            : Promise.resolve([] as RequestDto[]),
        ]);
        if (cancelled) return;
        setProfile(profileData);
        setRequests(requestsData);
        setDaysSince(
          profileData.lastDonatedAt
            ? Math.max(
                0,
                Math.floor(
                  (Date.now() - new Date(profileData.lastDonatedAt).getTime()) /
                    86_400_000,
                ),
              )
            : null,
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleAvailability = async () => {
    if (!profile) return;
    setToggling(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !profile.isAvailable }),
      });
      if (!res.ok) throw new Error("Failed to update availability");
      const updated = await res.json();
      setProfile((p) => (p ? { ...p, isAvailable: updated.isAvailable } : p));
    } finally {
      setToggling(false);
    }
  };

  const stats = useMemo(
    () => ({
      donationCount: profile?.donationCount ?? 0,
      badgeCount: profile?.badgeCount ?? 0,
      daysSince,
    }),
    [profile, daysSince],
  );

  const donorDto = user;
  const profileComplete = donorDto.hasCompletedProfile;

  const closeToast = useCallback(() => setToast(null), []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <Sidebar items={sidebarItems} active={active} onSelect={setActive} />

        <main className="min-w-0 flex-1 space-y-6">
          {!profileComplete && <ProfileIncompleteBanner />}

          {active === "overview" ? (
            <>
              <Card className="overflow-hidden border-none bg-gradient-to-br from-red-600 via-red-600 to-rose-700 text-white shadow-lg shadow-red-600/25">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-red-100">
                        Welcome back
                      </p>
                      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                        {donorDto.fullName} 👋
                      </h1>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge
                          tone="red"
                          className="border-red-400/30 bg-white/15 text-white"
                        >
                          <Droplets className="size-3" />
                          {bloodTypeLabel(donorDto.bloodType)}
                        </Badge>
                        {donorDto.city && (
                          <Badge
                            tone="red"
                            className="border-red-400/30 bg-white/15 text-white"
                          >
                            {donorDto.city}
                          </Badge>
                        )}
                        {donorDto.isAvailable && (
                          <Badge
                            tone="green"
                            className="border-emerald-300/40 bg-emerald-400/20 text-emerald-50"
                          >
                            <BadgeCheck className="size-3" />
                            Available to donate
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                      <div className="text-right">
                        <p className="text-sm font-semibold">Open to donate</p>
                        <p className="text-xs text-red-100">
                          {profile?.isAvailable
                            ? "Donors & doctors can find you"
                            : "Hidden from searches"}
                        </p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={
                          profile?.isAvailable ?? donorDto.isAvailable
                        }
                        onClick={() => void toggleAvailability()}
                        disabled={toggling || !profile}
                        className={cn(
                          "relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60",
                          (profile?.isAvailable ?? donorDto.isAvailable)
                            ? "bg-emerald-400"
                            : "bg-zinc-500/60",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform",
                            (profile?.isAvailable ?? donorDto.isAvailable) &&
                              "translate-x-5",
                          )}
                        />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              {profile ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <Droplets className="size-5" />
                      </span>
                      <div>
                        <p className="text-2xl font-bold text-zinc-900">
                          {stats.donationCount}
                        </p>
                        <p className="text-sm text-zinc-500">Donations</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <BadgeCheck className="size-5" />
                      </span>
                      <div>
                        <p className="text-2xl font-bold text-zinc-900">
                          {stats.badgeCount}
                        </p>
                        <p className="text-sm text-zinc-500">Badges earned</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <CalendarDays className="size-5" />
                      </span>
                      <div>
                        <p className="text-2xl font-bold text-zinc-900">
                          {stats.daysSince === null
                            ? "—"
                            : `${stats.daysSince}d`}
                        </p>
                        <p className="text-sm text-zinc-500">
                          Since last donation
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <LoaderBlock />
              )}

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="size-5 text-red-600" />
                      Open requests
                    </CardTitle>
                    <CardDescription>
                      Recent donation requests from hospitals
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {requests.length === 0 ? (
                    <div className="py-8 text-center">
                      <Siren className="mx-auto mb-3 size-10 text-zinc-300" />
                      <p className="text-sm font-medium text-zinc-700">
                        No open requests right now
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Check back soon — new requests appear here.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {requests.slice(0, 5).map((r) => (
                        <li
                          key={r.id}
                          className="group flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 p-4 transition hover:border-red-200 hover:bg-red-50/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40"
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedRequest(r)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedRequest(r);
                            }
                          }}
                        >
                          <span
                            className={cn(
                              "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                              r.priority === "EMERGENCY_SOS"
                                ? "bg-red-600 text-white"
                                : r.priority === "URGENT"
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-zinc-100 text-zinc-500",
                            )}
                          >
                            <Siren className="size-4.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-zinc-900">
                                {r.title}
                              </p>
                              {r.bloodType && (
                                <Badge tone="red">
                                  {bloodTypeLabel(r.bloodType)}
                                </Badge>
                              )}
                              <Badge tone="zinc">
                                {donationTypeLabel(r.type)}
                              </Badge>
                              {r.targetUserId === donorDto.id && (
                                <Badge
                                  tone="violet"
                                  className="bg-violet-600 text-white border-violet-600"
                                >
                                  <BadgeCheck className="size-3" />
                                  Direct Request for You
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                              {r.description}
                            </p>
                            <p className="mt-1.5 text-xs text-zinc-400">
                              {r.hospital} · {timeAgo(r.createdAt)}
                            </p>
                            <p className="mt-2 text-xs font-medium text-red-600 opacity-0 transition group-hover:opacity-100">
                              View details &amp; donate →
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </>
          ) : active === "leaderboard" ? (
            <LeaderboardView />
          ) : active === "profile" ? (
            <ProfileView embedded />
          ) : (
            <DonationHistory profileComplete={profileComplete} />
          )}
        </main>
      </div>

      <DonationDetailsModal
        request={selectedRequest}
        profileComplete={profileComplete}
        onClose={() => setSelectedRequest(null)}
        onDonated={() => {
          setSelectedRequest(null);
          setToast(
            "Thank you! Your willingness to donate has been sent to the hospital.",
          );
        }}
      />

      {toast && <Toast message={toast} onClose={closeToast} />}
    </div>
  );
}
