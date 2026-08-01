"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  Pencil,
  Siren,
  Stethoscope,
  Trash2,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import type { RequestPriority, RequestStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoaderBlock } from "@/components/ui/spinner";
import { Sidebar } from "@/components/shared/Sidebar";
import { ProfileIncompleteBanner } from "@/components/shared/ProfileIncompleteBanner";
import { DonorSearch } from "@/components/doctor/DonorSearch";
import { EmergencyModal } from "@/components/doctor/EmergencyModal";
import { ApplicantsModal } from "@/components/doctor/ApplicantsModal";
import { EditRequestModal } from "@/components/doctor/EditRequestModal";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";
import { ProfileView } from "@/components/profile/ProfileView";
import { Modal } from "@/components/ui/modal";
import {
  bloodTypeLabel,
  donationTypeLabel,
  priorityLabel,
  statusLabel,
  timeAgo,
  type ApplicationDto,
  type RequestDto,
  type UserDto,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "requests", label: "My Requests", icon: ClipboardList },
  { id: "donors", label: "Find Donors", icon: Users },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy },
  { id: "profile", label: "Doctor Profile", icon: UserRound },
];

const priorityTones: Record<RequestPriority, "red" | "amber" | "zinc"> = {
  EMERGENCY_SOS: "red",
  URGENT: "amber",
  NORMAL: "zinc",
};

const statusTones: Record<RequestStatus, "green" | "amber" | "zinc" | "red"> = {
  FULFILLED: "green",
  PENDING: "amber",
  CANCELLED: "zinc",
};

export function DoctorDashboardView({ user }: { user: UserDto }) {
  const [requests, setRequests] = useState<RequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState("overview");
  const [modalOpen, setModalOpen] = useState(false);
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestDto | null>(
    null,
  );
  const [applicantsOpen, setApplicantsOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<RequestDto | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<RequestDto | null>(
    null,
  );
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/requests");
      if (!res.ok) throw new Error("Failed to load requests");
      setRequests(await res.json());
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
        const res = await fetch("/api/requests");
        if (!res.ok) throw new Error("Failed to load requests");
        const data = await res.json();
        if (!cancelled) setRequests(data);
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

  const profileComplete = user.hasCompletedProfile;

  const loadApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/doctor/applications");
      if (!res.ok) throw new Error("Failed to load applications");
      setApplications(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const res = await fetch("/api/doctor/applications");
        if (!res.ok) throw new Error("Failed to load applications");
        const data = await res.json();
        if (!cancelled) setApplications(data);
      } catch (err) {
        if (!cancelled) console.error(err);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const applicantCount = useCallback(
    (requestId: string) =>
      applications.filter((a) => a.requestId === requestId).length,
    [applications],
  );

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "PENDING").length;
    const sos = requests.filter((r) => r.priority === "EMERGENCY_SOS").length;
    return { total, pending, sos };
  }, [requests]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <Sidebar items={sidebarItems} active={active} onSelect={setActive} />

        <main className="min-w-0 flex-1 space-y-6">
          {!profileComplete && <ProfileIncompleteBanner />}
          {active === "overview" && (
            <>
              <Card className="overflow-hidden border-none bg-gradient-to-br from-zinc-900 to-zinc-800 text-white shadow-lg">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-zinc-400">
                        Doctor dashboard
                      </p>
                      <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
                        {user.fullName}
                      </h1>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge
                          tone="red"
                          className="border-red-400/30 bg-red-500/20 text-red-100"
                        >
                          <Stethoscope className="size-3" />
                          DOCTOR
                        </Badge>
                        {user.hospitalName && (
                          <Badge
                            tone="zinc"
                            className="border-zinc-500/40 bg-zinc-500/20 text-zinc-200"
                          >
                            {user.hospitalName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => setModalOpen(true)}
                      disabled={!profileComplete}
                      className="bg-red-600 hover:bg-red-700"
                      title={
                        profileComplete
                          ? undefined
                          : "Complete your profile to create a request"
                      }
                    >
                      <Siren className="size-4" />
                      New Request
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}

              {loading ? (
                <LoaderBlock />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <ClipboardList className="size-5" />
                      </span>
                      <div>
                        <p className="text-2xl font-bold text-zinc-900">
                          {stats.total}
                        </p>
                        <p className="text-sm text-zinc-500">Total requests</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        <FilePlus2 className="size-5" />
                      </span>
                      <div>
                        <p className="text-2xl font-bold text-zinc-900">
                          {stats.pending}
                        </p>
                        <p className="text-sm text-zinc-500">Pending</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                        <Siren className="size-5" />
                      </span>
                      <div>
                        <p className="text-2xl font-bold text-zinc-900">
                          {stats.sos}
                        </p>
                        <p className="text-sm text-zinc-500">Emergency SOS</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>Recent requests</CardTitle>
                    <CardDescription>
                      Your latest donation requests
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActive("requests")}
                  >
                    View all
                  </Button>
                </CardHeader>
                <CardContent>
                  {requests.length === 0 ? (
                    <div className="py-8 text-center">
                      <ClipboardList className="mx-auto mb-3 size-10 text-zinc-300" />
                      <p className="text-sm font-medium text-zinc-700">
                        No requests yet
                      </p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Create your first request to reach donors.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-zinc-100">
                      {requests.slice(0, 4).map((r) => (
                        <li key={r.id} className="flex items-center gap-3 py-3">
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-lg",
                              r.priority === "EMERGENCY_SOS"
                                ? "bg-red-100 text-red-600"
                                : r.priority === "URGENT"
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-zinc-100 text-zinc-500",
                            )}
                          >
                            <Siren className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-zinc-900">
                              {r.title}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {timeAgo(r.createdAt)} · {r.hospital}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {r.bloodType && (
                              <Badge tone="red">
                                {bloodTypeLabel(r.bloodType)}
                              </Badge>
                            )}
                            <Badge tone={priorityTones[r.priority]}>
                              {priorityLabel(r.priority)}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(r);
                              setApplicantsOpen(true);
                            }}
                          >
                            <Users className="size-3.5" />
                            Applicants ({applicantCount(r.id)})
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {active === "requests" && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="size-5 text-red-600" />
                    My Requests
                  </CardTitle>
                  <CardDescription>
                    All donation requests you&apos;ve posted
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setModalOpen(true)}
                  disabled={!profileComplete}
                  title={
                    profileComplete
                      ? undefined
                      : "Complete your profile to create a request"
                  }
                >
                  <FilePlus2 className="size-4" />
                  New Request
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <LoaderBlock />
                ) : error ? (
                  <p className="py-8 text-center text-sm text-red-600">
                    {error}
                  </p>
                ) : requests.length === 0 ? (
                  <div className="py-10 text-center">
                    <ClipboardList className="mx-auto mb-3 size-10 text-zinc-300" />
                    <p className="text-sm font-medium text-zinc-700">
                      No requests yet
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {requests.map((r) => (
                      <li key={r.id} className="py-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
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
                              {r.targetUser && (
                                <Badge tone="violet">
                                  Direct → {r.targetUser.fullName}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                              {r.description}
                            </p>
                            <p className="mt-1 text-xs text-zinc-400">
                              {r.hospital} · {timeAgo(r.createdAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge tone={priorityTones[r.priority]}>
                              {priorityLabel(r.priority)}
                            </Badge>
                            <Badge tone={statusTones[r.status]}>
                              {statusLabel(r.status)}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(r);
                              setApplicantsOpen(true);
                            }}
                          >
                            <Users className="size-3.5" />
                            View Applicants ({applicantCount(r.id)})
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRequest(r)}
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => setDeletingRequest(r)}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {active === "donors" && <DonorSearch />}

          {active === "leaderboard" && <LeaderboardView />}

          {active === "profile" && <ProfileView embedded />}
        </main>
      </div>

      <EmergencyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={load}
        defaultHospital={user.hospitalName}
      />

      <ApplicantsModal
        open={applicantsOpen}
        request={selectedRequest}
        onClose={() => setApplicantsOpen(false)}
        onChanged={() => {
          void loadApplications();
          void load();
        }}
      />

      <EditRequestModal
        key={editingRequest?.id}
        open={!!editingRequest}
        request={editingRequest}
        onClose={() => setEditingRequest(null)}
        onSaved={() => {
          void load();
          void loadApplications();
        }}
      />

      <Modal
        open={!!deletingRequest}
        onClose={() => setDeletingRequest(null)}
        title="Delete request?"
        description="This will permanently remove the request and its applicants."
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-zinc-900">
              {deletingRequest?.title}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeletingRequest(null)}
              disabled={deleteBusy}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteBusy}
              onClick={async () => {
                if (!deletingRequest) return;
                setDeleteBusy(true);
                try {
                  const res = await fetch(
                    `/api/requests/${deletingRequest.id}`,
                    { method: "DELETE" },
                  );
                  if (!res.ok) throw new Error("Could not delete request");
                  setDeletingRequest(null);
                  await load();
                  await loadApplications();
                } catch (err) {
                  console.error(err);
                } finally {
                  setDeleteBusy(false);
                }
              }}
            >
              <Trash2 className="size-4" />
              {deleteBusy ? "Deleting…" : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
