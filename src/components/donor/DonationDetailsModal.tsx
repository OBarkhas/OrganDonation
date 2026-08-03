"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Droplets,
  HeartHandshake,
  MapPin,
  Siren,
} from "lucide-react";
import type { RequestDto } from "@/lib/utils";
import type { BloodType, RequestPriority } from "@/generated/prisma/client";
import {
  bloodTypeLabel,
  canDonateBlood,
  donationTypeLabel,
  formatDate,
  priorityLabel,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export interface DonationDetailsModalProps {
  request: RequestDto | null;
  profileComplete: boolean;

  donorBloodType: BloodType | null;

  nextEligibleAt: string | null;

  inCooldown: boolean;
  onClose: () => void;
  onDonated: () => void;
}

const priorityTones: Record<RequestPriority, "red" | "amber" | "zinc"> = {
  EMERGENCY_SOS: "red",
  URGENT: "amber",
  NORMAL: "zinc",
};

export function DonationDetailsModal({
  request,
  profileComplete,
  donorBloodType,
  nextEligibleAt,
  inCooldown,
  onClose,
  onDonated,
}: DonationDetailsModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compatible = request?.bloodType
    ? canDonateBlood(donorBloodType, request.bloodType)
    : true;
  const canDonate = compatible && !inCooldown;

  if (!request) return null;

  const handleDonate = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          type: request.type,
          status: "PENDING",
          notes: `Willing to donate for "${request.title}" at ${request.hospital}`,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Could not register donation");
      }
      onDonated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const location = request.doctor?.city ?? request.hospital;

  return (
    <Modal
      open={!!request}
      onClose={onClose}
      title="Donation details"
      description={request.title}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <Building2 className="size-3.5" />
              Hospital
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              {request.hospital}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <MapPin className="size-3.5" />
              Location
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              {location || "—"}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <Droplets className="size-3.5" />
              Required type
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {request.bloodType && (
                <Badge tone="red">{bloodTypeLabel(request.bloodType)}</Badge>
              )}
              <Badge tone="zinc">{donationTypeLabel(request.type)}</Badge>
              {request.bloodType &&
                donorBloodType &&
                (compatible ? (
                  <Badge tone="green">🟢 Compatible</Badge>
                ) : (
                  <Badge tone="red">🔴 Incompatible</Badge>
                ))}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <Siren className="size-3.5" />
              Urgency
            </p>
            <div className="mt-1">
              <Badge tone={priorityTones[request.priority]}>
                {priorityLabel(request.priority)}
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-medium text-zinc-500">
            Description
          </p>
          <p className="rounded-xl border border-zinc-200 bg-white p-3.5 text-sm leading-relaxed text-zinc-700">
            {request.description}
          </p>
        </div>

        {inCooldown && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You must wait 30 days between donations. You can donate again on{" "}
            <span className="font-semibold">{formatDate(nextEligibleAt)}</span>.
          </div>
        )}

        {!compatible && donorBloodType && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            This request requires{" "}
            <span className="font-semibold">
              {bloodTypeLabel(request.bloodType)}
            </span>{" "}
            blood. Your blood type (
            <span className="font-semibold">
              {bloodTypeLabel(donorBloodType)}
            </span>
            ) is not compatible.
          </div>
        )}

        {profileComplete ? (
          <Button
            size="lg"
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={() => void handleDonate()}
            disabled={saving || !canDonate}
          >
            <HeartHandshake className="size-4" />
            {saving
              ? "Sending…"
              : inCooldown
                ? "Not eligible yet"
                : !compatible
                  ? "Blood type not compatible"
                  : "Donate Now"}
          </Button>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">
              To donate, please complete your profile details (Blood type,
              phone, city).
            </p>
            <Link
              href="/onboarding"
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
            >
              Complete Profile
            </Link>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
