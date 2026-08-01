import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { getBadgeStatusForDonor } from "@/lib/badges";

export const dynamic = "force-dynamic";

/**
 * GET /api/profile — the signed-in user's own profile, shaped by role.
 * - DONOR: personal info, completed donation count, badge status (earned/locked).
 * - DOCTOR: hospital info, verification, total requests, successful matches.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.role === "DOCTOR") {
    const [requestCount, matchCount] = await Promise.all([
      db.medicalRequest.count({ where: { doctorId: user.id } }),
      db.donationRecord.count({
        where: { request: { doctorId: user.id }, status: "COMPLETED" },
      }),
    ]);
    return NextResponse.json({
      role: "DOCTOR",
      fullName: user.fullName,
      email: user.email,
      hospitalName: user.hospitalName,
      isDoctorVerified: user.isDoctorVerified,
      requestCount,
      matchCount,
    });
  }

  const [donationCount, badgeStatus] = await Promise.all([
    db.donationRecord.count({
      where: { donorId: user.id, status: "COMPLETED" },
    }),
    getBadgeStatusForDonor(user.id),
  ]);

  return NextResponse.json({
    role: "DONOR",
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    bloodType: user.bloodType,
    city: user.city,
    isAvailable: user.isAvailable,
    donationTypes: user.donationTypes,
    donationCount,
    badgeStatus,
  });
}
