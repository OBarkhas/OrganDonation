import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { awardBadgesForDonor } from "@/lib/badges";
import { hasCompletedProfile } from "@/lib/utils";
import type { DonationStatus, DonationType } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const donations = await db.donationRecord.findMany({
    where: { donorId: user.id },
    include: {
      request: { select: { id: true, title: true, hospital: true } },
    },
    orderBy: { donatedAt: "desc" },
  });

  return NextResponse.json(donations);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    requestId?: string;
    type?: DonationType;
    notes?: string;
    status?: DonationStatus;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { requestId, type, notes } = body;
  const validTypes: DonationType[] = ["BLOOD", "PLASMA", "ORGAN", "TISSUE"];
  if (!type || !validTypes.includes(type)) {
    return NextResponse.json(
      { error: "Invalid donation type" },
      { status: 400 },
    );
  }

  const validStatuses: DonationStatus[] = [
    "PENDING",
    "ACCEPTED",
    "REJECTED",
    "COMPLETED",
    "CANCELLED",
  ];
  const status: DonationStatus =
    body.status && validStatuses.includes(body.status)
      ? body.status
      : "PENDING";

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!hasCompletedProfile(user)) {
    return NextResponse.json(
      { error: "Complete your profile to donate" },
      { status: 403 },
    );
  }

  if (requestId) {
    const linkedRequest = await db.medicalRequest.findUnique({
      where: { id: requestId },
      select: { id: true },
    });
    if (!linkedRequest) {
      return NextResponse.json(
        { error: "Linked request not found" },
        { status: 400 },
      );
    }
  }

  try {
    const record = await db.$transaction([
      db.donationRecord.create({
        data: {
          donorId: user.id,
          requestId: requestId ?? null,
          type,
          status,
          notes:
            typeof notes === "string" && notes.trim() ? notes.trim() : null,
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: { lastDonatedAt: new Date() },
      }),
    ]);

    if (status === "COMPLETED") {
      await awardBadgesForDonor(user.id).catch((err) =>
        console.error("[api/donations] badge awarding failed:", err),
      );
    }

    return NextResponse.json(record[0], { status: 201 });
  } catch (err) {
    console.error("[api/donations] POST failed:", err);
    return NextResponse.json(
      { error: "Could not log donation" },
      { status: 500 },
    );
  }
}
