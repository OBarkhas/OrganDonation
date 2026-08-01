"use client";

import { useEffect, useState } from "react";
import {
  Award,
  BadgeCheck,
  CalendarClock,
  Droplets,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import type { DonorProfileDto } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LoaderBlock } from "@/components/ui/spinner";
import {
  bloodTypeLabel,
  donationTypeLabel,
  formatDate,
  initials,
} from "@/lib/utils";

export interface DonorProfileModalProps {
  open: boolean;
  donorId: string | null;
  onClose: () => void;
  onRequestDirect: (donorId: string) => void;
}

/** Full donor profile modal with a "Request Directly to this User" action. */
export function DonorProfileModal({
  open,
  donorId,
  onClose,
  onRequestDirect,
}: DonorProfileModalProps) {
  const [donor, setDonor] = useState<DonorProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !donorId) return;
    let cancelled = false;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/donors/${donorId}`);
        if (!res.ok) throw new Error("Failed to load donor profile");
        const data = await res.json();
        if (!cancelled) setDonor(data);
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
  }, [open, donorId]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Donor profile"
      description={donor?.fullName ?? "Loading donor…"}
    >
      {loading ? (
        <LoaderBlock />
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : donor ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-red-50 text-2xl font-bold text-red-600">
              {initials(donor.fullName)}
            </span>
            <div>
              <p className="flex items-center gap-2 text-lg font-bold text-zinc-900">
                {donor.fullName}
                {donor.isAvailable && (
                  <BadgeCheck className="size-5 text-emerald-500" />
                )}
              </p>
              <p className="flex items-center gap-1 text-sm text-zinc-500">
                <Mail className="size-3.5" />
                {donor.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <Droplets className="size-3.5" />
                Completed donations
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">
                {donor.donationCount}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <Award className="size-3.5" />
                Badges earned
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">
                {donor.badges.length}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
              <p className="text-xs font-medium text-zinc-500">Blood type</p>
              {donor.bloodType ? (
                <Badge tone="red" className="mt-1.5">
                  {bloodTypeLabel(donor.bloodType)}
                </Badge>
              ) : (
                <p className="mt-1 text-sm text-zinc-400">Not set</p>
              )}
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <MapPin className="size-3.5" />
                Location
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                {donor.city ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <Phone className="size-3.5" />
                Phone
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                {donor.phone ?? "—"}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                <CalendarClock className="size-3.5" />
                Last donated
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900">
                {donor.lastDonatedAt
                  ? formatDate(donor.lastDonatedAt)
                  : "Never"}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-500">
              Offers to donate
            </p>
            <div className="flex flex-wrap gap-1.5">
              {donor.donationTypes.length > 0 ? (
                donor.donationTypes.map((t) => (
                  <Badge key={t} tone="zinc">
                    {donationTypeLabel(t)}
                  </Badge>
                ))
              ) : (
                <Badge tone="zinc">Blood</Badge>
              )}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-500">
              Earned badges
            </p>
            {donor.badges.length === 0 ? (
              <p className="text-sm text-zinc-400">No badges yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {donor.badges.map((b) => (
                  <span
                    key={b.id}
                    title={b.name}
                    className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm"
                  >
                    <span>{b.iconUrl}</span>
                    {b.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => onRequestDirect(donor.id)}
          >
            <Send className="size-4" />
            Request Directly to this User
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}
