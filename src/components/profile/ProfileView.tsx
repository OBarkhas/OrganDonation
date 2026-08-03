"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Award,
  BadgeCheck,
  Building2,
  ClipboardList,
  Droplets,
  HeartHandshake,
  Lock,
  MapPin,
  Pencil,
  Phone,
  Stethoscope,
  UserRound,
} from "lucide-react";
import type { ProfileDto } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoaderBlock } from "@/components/ui/spinner";
import {
  bloodTypeLabel,
  donationTypeLabel,
  formatDate,
  initials,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

export function ProfileView({ embedded = false }: { embedded?: boolean }) {
  const [profile, setProfile] = useState<ProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        if (!cancelled) setProfile(data);
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

  if (loading) return <LoaderBlock />;
  if (error) {
    return <p className="py-8 text-center text-sm text-red-600">{error}</p>;
  }
  if (!profile) return null;

  return (
    <div
      className={
        embedded
          ? "mx-auto max-w-3xl space-y-6"
          : "mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 lg:py-8"
      }
    >
      <Card className="overflow-hidden border-none bg-gradient-to-br from-red-600 via-red-600 to-rose-700 text-white shadow-lg shadow-red-600/25">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold">
                {initials(profile.fullName)}
              </span>
              <div>
                <p className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
                  {profile.fullName}
                  {profile.role === "DOCTOR" && profile.isDoctorVerified && (
                    <BadgeCheck className="size-5 text-emerald-300" />
                  )}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge
                    tone="red"
                    className="border-red-400/30 bg-white/15 text-white"
                  >
                    {profile.role === "DOCTOR" ? (
                      <Stethoscope className="size-3" />
                    ) : (
                      <UserRound className="size-3" />
                    )}
                    {profile.role}
                  </Badge>
                  {profile.city && (
                    <Badge
                      tone="red"
                      className="border-red-400/30 bg-white/15 text-white"
                    >
                      <MapPin className="size-3" />
                      {profile.city}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <Pencil className="size-4" />
              Edit Profile
            </Link>
          </div>
        </CardContent>
      </Card>

      {profile.role === "DOCTOR" ? (
        <DoctorProfileView profile={profile} />
      ) : (
        <DonorProfileView profile={profile} />
      )}
    </div>
  );
}

function DoctorProfileView({ profile }: { profile: ProfileDto }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
              <Building2 className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-zinc-500">Hospital</p>
              <p className="truncate text-sm font-semibold text-zinc-900">
                {profile.hospitalName ?? "Not set"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <BadgeCheck className="size-5" />
            </span>
            <div>
              <p className="text-sm text-zinc-500">Verification</p>
              <p className="text-sm font-semibold text-zinc-900">
                {profile.isDoctorVerified ? "Verified" : "Unverified"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ClipboardList className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-zinc-900">
                {profile.requestCount ?? 0}
              </p>
              <p className="text-sm text-zinc-500">Requests created</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <HeartHandshake className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-zinc-900">
                {profile.matchCount ?? 0}
              </p>
              <p className="text-sm text-zinc-500">Successful matches</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function DonorProfileView({ profile }: { profile: ProfileDto }) {
  const earned = profile.badgeStatus?.filter((b) => b.earned) ?? [];
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Droplets className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-zinc-900">
                {profile.donationCount ?? 0}
              </p>
              <p className="text-sm text-zinc-500">Successful donations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
              <Droplets className="size-5" />
            </span>
            <div>
              <p className="text-sm text-zinc-500">Blood type</p>
              <p className="text-sm font-bold text-zinc-900">
                {bloodTypeLabel(profile.bloodType)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Award className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-zinc-900">
                {earned.length}
              </p>
              <p className="text-sm text-zinc-500">Badges earned</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {profile.phone && (
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Phone className="size-4 text-zinc-400" />
            <p className="text-sm text-zinc-600">{profile.phone}</p>
          </CardContent>
        </Card>
      )}

      {profile.donationTypes && profile.donationTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Offers to donate</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {profile.donationTypes.map((t) => (
              <Badge key={t} tone="zinc">
                {donationTypeLabel(t)}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="size-5 text-amber-500" />
            Badges
          </CardTitle>
          <CardDescription>
            Achievements earned through completed donations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!profile.badgeStatus || profile.badgeStatus.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-400">
              Complete your first donation to unlock badges.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {profile.badgeStatus.map((b) => (
                <div
                  key={b.key}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3.5",
                    b.earned
                      ? "border-amber-200 bg-amber-50/60"
                      : "border-zinc-100 bg-zinc-50/60 opacity-70",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                    {b.earned ? (
                      b.iconUrl
                    ) : (
                      <Lock className="size-4 text-zinc-400" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-900">
                      {b.name}
                    </p>
                    <p className="text-xs text-zinc-500">{b.description}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">
                      {b.earned && b.awardedAt
                        ? `Earned ${formatDate(b.awardedAt)}`
                        : `${b.threshold} ${b.threshold === 1 ? "donation" : "donations"} to unlock`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
