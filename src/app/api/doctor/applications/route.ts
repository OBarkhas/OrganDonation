import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { awardBadgesForDonor } from "@/lib/badges";
import type { DonationStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const VALID_UPDATES: DonationStatus[] = [
  "ACCEPTED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
];

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.role !== "DOCTOR") {
    return NextResponse.json(
      { error: "Only doctors can view applications" },
      { status: 403 },
    );
  }

  const applications = await db.donationRecord.findMany({
    where: { request: { doctorId: user.id } },
    include: {
      donor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          bloodType: true,
          city: true,
        },
      },
      request: {
        select: {
          id: true,
          title: true,
          hospital: true,
          type: true,
          bloodType: true,
          priority: true,
        },
      },
    },
    orderBy: { donatedAt: "desc" },
  });

  return NextResponse.json(applications);
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.role !== "DOCTOR") {
    return NextResponse.json(
      { error: "Only doctors can update applications" },
      { status: 403 },
    );
  }

  let body: { applicationId?: string; status?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { applicationId, status, note } = body;
  if (!applicationId || typeof applicationId !== "string") {
    return NextResponse.json(
      { error: "applicationId is required" },
      { status: 400 },
    );
  }
  if (!status || !VALID_UPDATES.includes(status as DonationStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (status === "ACCEPTED" && !note?.trim()) {
    return NextResponse.json(
      { error: "An appointment note is required to accept" },
      { status: 400 },
    );
  }

  const application = await db.donationRecord.findUnique({
    where: { id: applicationId },
    include: {
      request: { select: { doctorId: true, title: true } },
      donor: { select: { id: true } },
    },
  });
  if (!application) {
    return NextResponse.json(
      { error: "Application not found" },
      { status: 404 },
    );
  }
  if (!application.request || application.request.doctorId !== user.id) {
    return NextResponse.json(
      { error: "This application does not belong to your requests" },
      { status: 403 },
    );
  }

  const current = application.status;
  const allowed: Record<string, DonationStatus[]> = {
    ACCEPT: ["PENDING"],
    REJECT: ["PENDING", "ACCEPTED"],
    COMPLETE: ["ACCEPTED"],
    NO_SHOW: ["ACCEPTED"],
  };
  const actionKey =
    status === "ACCEPTED"
      ? "ACCEPT"
      : status === "REJECTED"
        ? "REJECT"
        : status === "COMPLETED"
          ? "COMPLETE"
          : "NO_SHOW";
  if (!allowed[actionKey].includes(current)) {
    return NextResponse.json(
      {
        error: `Cannot change an application from ${current} to ${status}`,
      },
      { status: 409 },
    );
  }

  const donorId = application.donor.id;
  const requestTitle = application.request.title;

  const data: {
    status: DonationStatus;
    appointmentNote?: string | null;
    rejectionReason?: string | null;
    donatedAt?: Date;
  } =
    status === "ACCEPTED"
      ? {
          status: "ACCEPTED",
          appointmentNote: note!.trim(),
          rejectionReason: null,
        }
      : status === "REJECTED"
        ? {
            status: "REJECTED",
            rejectionReason: note?.trim() || null,
            appointmentNote: null,
          }
        : status === "CANCELLED"
          ? { status: "CANCELLED", appointmentNote: null }
          : { status: "COMPLETED", donatedAt: new Date() };

  const title =
    status === "ACCEPTED"
      ? "Donation appointment scheduled"
      : status === "REJECTED"
        ? "Donation application declined"
        : status === "CANCELLED"
          ? "Appointment missed"
          : "Donation completed";

  const message =
    status === "ACCEPTED"
      ? `Your donation for "${requestTitle}" was accepted. ${note!.trim()}`
      : status === "REJECTED"
        ? `Your donation for "${requestTitle}" was declined.${
            note?.trim() ? ` ${note.trim()}` : ""
          }`
        : status === "CANCELLED"
          ? "Your appointment was marked as missed by the hospital."
          : `Thank you! Your donation for "${requestTitle}" was completed.`;

  await db.$transaction([
    db.donationRecord.update({ where: { id: applicationId }, data }),
    db.notification.create({
      data: { userId: donorId, title, message, link: "/" },
    }),
    ...(status === "COMPLETED"
      ? [
          db.user.update({
            where: { id: donorId },
            data: { lastDonatedAt: new Date() },
          }),
        ]
      : []),
  ]);

  if (status === "COMPLETED") {
    await awardBadgesForDonor(donorId).catch((err) =>
      console.error("[api/doctor/applications] badge awarding failed:", err),
    );
  }

  return NextResponse.json({ ok: true, status });
}
