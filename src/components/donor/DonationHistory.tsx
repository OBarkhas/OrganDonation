"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Droplets,
  Plus,
  XCircle,
} from "lucide-react";
import type { DonationStatus, DonationType } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label, Select, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { LoaderBlock } from "@/components/ui/spinner";
import {
  DONATION_TYPE_LABELS,
  donationStatusLabel,
  formatDate,
  type DonationDto,
} from "@/lib/utils";

const typeTones: Record<DonationType, "red" | "blue" | "violet" | "amber"> = {
  BLOOD: "red",
  PLASMA: "amber",
  ORGAN: "violet",
  TISSUE: "blue",
};

const statusTones: Record<DonationStatus, "green" | "amber" | "zinc" | "red"> =
  {
    ACCEPTED: "green",
    COMPLETED: "green",
    PENDING: "amber",
    CANCELLED: "zinc",
    REJECTED: "red",
  };

export function DonationHistory({
  profileComplete,
}: {
  profileComplete: boolean;
}) {
  const [donations, setDonations] = useState<DonationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DonationType>("BLOOD");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/donations");
      if (!res.ok) throw new Error("Failed to load donations");
      setDonations(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const res = await fetch("/api/donations");
        if (!res.ok) throw new Error("Failed to load donations");
        const data = await res.json();
        if (!cancelled) setDonations(data);
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

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          notes: notes.trim() || undefined,
          status: "COMPLETED",
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Could not log donation");
      }
      setOpen(false);
      setNotes("");
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="size-5 text-red-600" />
              Donation History
            </CardTitle>
            <CardDescription>Every donation you&apos;ve made</CardDescription>
          </div>
          <Button
            onClick={() => setOpen(true)}
            disabled={!profileComplete}
            title={
              profileComplete ? undefined : "Complete your profile to donate"
            }
          >
            <Plus className="size-4" />
            Log Donation
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoaderBlock />
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-600">{error}</p>
          ) : donations.length === 0 ? (
            <div className="py-10 text-center">
              <Droplets className="mx-auto mb-3 size-10 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-700">
                No donations yet
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Log your first donation to start your history.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {donations.map((d) => (
                <li key={d.id} className="py-4">
                  <div className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                      <Droplets className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-900">
                            {DONATION_TYPE_LABELS[d.type]}
                            {d.request?.hospital && (
                              <span className="ml-2 font-normal text-zinc-400">
                                · {d.request.hospital}
                              </span>
                            )}
                          </p>
                          {d.notes && (
                            <p className="truncate text-sm text-zinc-500">
                              {d.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge tone={typeTones[d.type]}>
                            {DONATION_TYPE_LABELS[d.type]}
                          </Badge>
                          <Badge tone={statusTones[d.status]}>
                            {donationStatusLabel(d.status)}
                          </Badge>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">
                        {formatDate(d.donatedAt)}
                      </p>

                      {d.status === "PENDING" && (
                        <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                          <Clock className="size-3.5" />
                          Awaiting the hospital&apos;s response
                        </p>
                      )}

                      {d.status === "ACCEPTED" && (
                        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                            <CalendarCheck className="size-4" />
                            You&apos;re scheduled to donate!
                          </p>
                          {d.appointmentNote ? (
                            <p className="mt-1.5 text-sm leading-relaxed text-emerald-900">
                              {d.appointmentNote}
                            </p>
                          ) : (
                            <p className="mt-1.5 text-sm text-emerald-800">
                              The hospital has accepted your donation. Please
                              watch for appointment instructions.
                            </p>
                          )}
                          {d.request?.hospital && (
                            <p className="mt-2 text-xs font-medium text-emerald-700">
                              {d.request.hospital}
                            </p>
                          )}
                        </div>
                      )}

                      {d.status === "REJECTED" && (
                        <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700">
                          <XCircle className="size-3.5" />
                          {d.rejectionReason
                            ? `Declined: ${d.rejectionReason}`
                            : "The hospital declined this application."}
                        </p>
                      )}

                      {d.status === "COMPLETED" && (
                        <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="size-3.5" />
                          Donation completed — thank you!
                        </p>
                      )}

                      {d.status === "CANCELLED" && (
                        <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600">
                          <XCircle className="size-3.5" />
                          {d.requestId
                            ? "Cancelled by the hospital — the appointment did not take place."
                            : "This donation was cancelled."}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Log a donation"
        description="Record a blood, plasma, organ or tissue donation."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="donation-type">Donation type</Label>
            <Select
              id="donation-type"
              value={type}
              onChange={(e) => setType(e.target.value as DonationType)}
            >
              {Object.entries(DONATION_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="donation-notes">Notes (optional)</Label>
            <Textarea
              id="donation-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Donated at the Central Blood Bank"
            />
          </div>
          {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save donation"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
