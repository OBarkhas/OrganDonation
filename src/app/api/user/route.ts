import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { BloodType, DonationType } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const VALID_BLOOD_TYPES: BloodType[] = [
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
];

const VALID_DONATION_TYPES: DonationType[] = [
  "BLOOD",
  "PLASMA",
  "ORGAN",
  "TISSUE",
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

  const [donationCount, badgeCount] = await Promise.all([
    db.donationRecord.count({
      where: { donorId: user.id, status: "COMPLETED" },
    }),
    db.userBadge.count({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({ ...user, donationCount, badgeCount });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const data: {
    fullName?: string;
    bloodType?: BloodType | null;
    phone?: string | null;
    city?: string | null;
    isAvailable?: boolean;
    isProfileComplete?: boolean;
    hospitalName?: string | null;
    donationTypes?: DonationType[];
  } = {};

  if ("fullName" in body) {
    const name = typeof body.fullName === "string" ? body.fullName.trim() : "";
    if (!name) {
      return NextResponse.json(
        { error: "Full name is required" },
        { status: 400 },
      );
    }
    data.fullName = name;
  }
  if ("isProfileComplete" in body) {
    data.isProfileComplete = Boolean(body.isProfileComplete);
  }
  if ("bloodType" in body) {
    const bt = (body.bloodType as string | null) ?? null;
    if (bt !== null && !VALID_BLOOD_TYPES.includes(bt as BloodType)) {
      return NextResponse.json(
        { error: "Invalid blood type" },
        { status: 400 },
      );
    }
    data.bloodType = bt as BloodType | null;
  }
  if ("phone" in body) {
    data.phone = typeof body.phone === "string" ? body.phone : null;
  }
  if ("city" in body) {
    data.city = typeof body.city === "string" ? body.city : null;
  }
  if ("isAvailable" in body) {
    data.isAvailable = Boolean(body.isAvailable);
  }
  if ("donationTypes" in body) {
    if (
      !Array.isArray(body.donationTypes) ||
      (body.donationTypes as unknown[]).some(
        (t) => !VALID_DONATION_TYPES.includes(t as DonationType),
      )
    ) {
      return NextResponse.json(
        { error: "Invalid donation types" },
        { status: 400 },
      );
    }
    data.donationTypes = body.donationTypes as DonationType[];
  }
  if ("hospitalName" in body) {
    const current = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { role: true },
    });
    if (current?.role !== "DOCTOR") {
      return NextResponse.json(
        { error: "Only doctors can set a hospital name" },
        { status: 403 },
      );
    }
    data.hospitalName =
      typeof body.hospitalName === "string" ? body.hospitalName : null;
  }

  try {
    const user = await db.user.update({
      where: { clerkUserId: userId },
      data,
    });
    return NextResponse.json(user);
  } catch (err) {
    console.error("[api/user] PATCH failed:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
