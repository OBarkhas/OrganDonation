"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CalendarX2,
  Check,
  CheckCircle2,
  Droplets,
  Mail,
  MapPin,
  Phone,
  UserX,
  Users,
} from "lucide-react";
import type { ApplicationDto, RequestDto } from "@/lib/utils";
import type { DonationStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { LoaderBlock } from "@/components/ui/spinner";
import { Toast } from "@/components/ui/toast";
import {
  bloodTypeLabel,
  donationTypeLabel,
  formatDate,
  initials,
} from "@/lib/utils";

export interface ApplicantsModalProps {
  open: boolean;
  request: RequestDto | null;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}

type ActionKind = "ACCEPT" | "REJECT" | "COMPLETE" | "NO_SHOW";

const statusTones: Record<DonationStatus, "green" | "amber" | "zinc" | "red"> =
  {
    PENDING: "amber",
    ACCEPTED: "green",
    REJECTED: "red",
    COMPLETED: "green",
    CANCELLED: "zinc",
  };

const statusLabels: Record<DonationStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/**
 * Lists every donor who applied to a request and lets the doctor accept
 * (with appointment instructions), reject, or mark as completed.
 */
export function ApplicantsModal({
  open,
  request,
  onClose,
  onChanged,
}: ApplicantsModalProps) {
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actingOn, setActingOn] = useState<string | null>(null);
  const [actionKind, setActionKind] = useState<ActionKind | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const requestId = request?.id ?? "";

  const load = async () => {
    if (!requestId) return;
    try {
      const res = await fetch("/api/doctor/applications");
      if (!res.ok) throw new Error("Failed to load applicants");
      const data = (await res.json()) as ApplicationDto[];
      setApplications(data.filter((a) => a.requestId === requestId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !request) return;
    let cancelled = false;
    async function init() {
      setLoading(true);
      setError(null);
      setActingOn(null);
      setActionKind(null);
      setNote("");
      try {
        const res = await fetch("/api/doctor/applications");
        if (!res.ok) throw new Error("Failed to load applicants");
        const data = (await res.json()) as ApplicationDto[];
        if (!cancelled) {
          setApplications(data.filter((a) => a.requestId === requestId));
        }
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
  }, [open, requestId, request]);

  const pendingCount = useMemo(
    () => applications.filter((a) => a.status === "PENDING").length,
    [applications],
  );

  const beginAction = (id: string, kind: ActionKind) => {
    setActingOn(id);
    setActionKind(kind);
    setNote("");
    setActionError(null);
  };

  const cancelAction = () => {
    setActingOn(null);
    setActionKind(null);
    setNote("");
    setActionError(null);
  };

  const submitAction = async () => {
    if (!actingOn || !actionKind) return;
    setBusy(true);
    setActionError(null);
    try {
      const status =
        actionKind === "ACCEPT"
          ? "ACCEPTED"
          : actionKind === "REJECT"
            ? "REJECTED"
            : actionKind === "COMPLETE"
              ? "COMPLETED"
              : "CANCELLED";
      const res = await fetch("/api/doctor/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: actingOn,
          status,
          note: note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Could not update application");
      }
      cancelAction();
      setToast(
        actionKind === "ACCEPT"
          ? "Applicant accepted and notified"
          : actionKind === "REJECT"
            ? "Applicant declined"
            : actionKind === "COMPLETE"
              ? "Donation marked as completed"
              : "Marked as missed and notified",
      );
      await load();
      await onChanged();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setBusy(false);
    }
  };

  if (!request) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Applicants"
      description={`${request.title} · ${pendingCount} pending`}
      className="max-w-2xl"
    >
      {loading ? (
        <LoaderBlock />
      ) : error ? (
        <p className="py-8 text-center text-sm text-red-600">{error}</p>
      ) : applications.length === 0 ? (
        <div className="py-10 text-center">
          <Users className="mx-auto mb-3 size-10 text-zinc-300" />
          <p className="text-sm font-medium text-zinc-700">No applicants yet</p>
          <p className="mt-1 text-sm text-zinc-500">
            Donors who press &ldquo;Donate Now&rdquo; on this request will show
            up here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {applications.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-zinc-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-sm font-bold text-red-600">
                    {initials(a.donor.fullName)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900">
                      {a.donor.fullName}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-zinc-500">
                      <Mail className="size-3" />
                      {a.donor.email}
                    </p>
                  </div>
                </div>
                <Badge tone={statusTones[a.status]}>
                  {statusLabels[a.status]}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
                {a.donor.bloodType && (
                  <span className="inline-flex items-center gap-1 font-medium text-red-600">
                    <Droplets className="size-3.5" />
                    {bloodTypeLabel(a.donor.bloodType)}
                  </span>
                )}
                {a.donor.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3.5" />
                    {a.donor.phone}
                  </span>
                )}
                {a.donor.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" />
                    {a.donor.city}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <CalendarCheck className="size-3.5" />
                  Applied {formatDate(a.donatedAt)}
                </span>
              </div>

              {a.notes && (
                <p className="mt-2.5 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                  {a.notes}
                </p>
              )}

              {a.status === "ACCEPTED" && a.appointmentNote && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CalendarCheck className="size-3.5" />
                    Appointment sent to donor
                  </p>
                  <p className="mt-1 text-sm text-emerald-900">
                    {a.appointmentNote}
                  </p>
                </div>
              )}
              {a.status === "REJECTED" && (
                <p className="mt-2.5 text-xs font-medium text-red-600">
                  {a.rejectionReason
                    ? `Declined: ${a.rejectionReason}`
                    : "Declined without a reason"}
                </p>
              )}
              {a.status === "COMPLETED" && (
                <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="size-3.5" />
                  Donation completed
                </p>
              )}

              {actingOn === a.id && actionKind ? (
                <div className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5">
                  {actionKind === "ACCEPT" && (
                    <div>
                      <Label htmlFor={`appt-${a.id}`}>
                        Appointment instructions for donor
                      </Label>
                      <Textarea
                        id={`appt-${a.id}`}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Please come to Room 102 tomorrow at 09:00 AM"
                        autoFocus
                      />
                    </div>
                  )}
                  {actionKind === "REJECT" && (
                    <div>
                      <Label htmlFor={`reject-${a.id}`}>
                        Reason (optional)
                      </Label>
                      <Input
                        id={`reject-${a.id}`}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Blood type mismatch"
                      />
                    </div>
                  )}
                  {actionKind === "COMPLETE" && (
                    <p className="text-sm text-zinc-600">
                      Confirm the donor arrived and donated? This will update
                      their donation history.
                    </p>
                  )}
                  {actionKind === "NO_SHOW" && (
                    <p className="text-sm text-zinc-600">
                      Mark this appointment as missed? The donor will be
                      notified that they didn&apos;t show up.
                    </p>
                  )}
                  {actionError && (
                    <p className="text-sm text-red-600">{actionError}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={cancelAction}
                      disabled={busy}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => void submitAction()}
                      disabled={
                        busy || (actionKind === "ACCEPT" && !note.trim())
                      }
                      className={
                        actionKind === "REJECT"
                          ? "bg-zinc-700 hover:bg-zinc-800"
                          : actionKind === "NO_SHOW"
                            ? "bg-amber-600 hover:bg-amber-700"
                            : undefined
                      }
                    >
                      {busy
                        ? "Saving…"
                        : actionKind === "ACCEPT"
                          ? "Accept & notify"
                          : actionKind === "REJECT"
                            ? "Reject"
                            : actionKind === "COMPLETE"
                              ? "Confirm completed"
                              : "Confirm missed"}
                    </Button>
                  </div>
                </div>
              ) : a.status === "PENDING" ? (
                <div className="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-3">
                  <Button size="sm" onClick={() => beginAction(a.id, "ACCEPT")}>
                    <Check className="size-3.5" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => beginAction(a.id, "REJECT")}
                  >
                    <UserX className="size-3.5" />
                    Reject
                  </Button>
                  <span className="ml-auto text-xs text-zinc-400">
                    {donationTypeLabel(a.type)}
                  </span>
                </div>
              ) : a.status === "ACCEPTED" ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => beginAction(a.id, "COMPLETE")}
                  >
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    Mark as Completed
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => beginAction(a.id, "NO_SHOW")}
                  >
                    <CalendarX2 className="size-3.5 text-amber-600" />
                    User Didn&apos;t Show Up
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </Modal>
  );
}
