import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/donors/[id]">,
) {
  const { id } = await ctx.params;

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
      { error: "Only doctors can view donor profiles" },
      { status: 403 },
    );
  }

  const donor = await db.user.findUnique({
    where: { id, role: "DONOR" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      bloodType: true,
      city: true,
      isAvailable: true,
      lastDonatedAt: true,
      donationTypes: true,
      receivedBadges: {
        select: {
          badge: { select: { id: true, key: true, name: true, iconUrl: true } },
        },
      },
    },
  });
  if (!donor) {
    return NextResponse.json({ error: "Donor not found" }, { status: 404 });
  }

  const donationCount = await db.donationRecord.count({
    where: { donorId: id, status: "COMPLETED" },
  });

  return NextResponse.json({
    ...donor,
    donationCount,
    badges: donor.receivedBadges.map((rb) => rb.badge),
  });
}
