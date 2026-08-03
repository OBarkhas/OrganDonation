import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { ensureBadges } from "@/lib/badges";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureBadges();

  const donors = await db.user.findMany({
    where: { role: "DONOR" },
    select: {
      id: true,
      fullName: true,
      email: true,
      bloodType: true,
      city: true,
      receivedBadges: {
        select: {
          badge: {
            select: { id: true, key: true, name: true, iconUrl: true },
          },
        },
      },
      _count: {
        select: { donations: { where: { status: "COMPLETED" } } },
      },
    },
  });

  const ranked = donors
    .map((d) => ({
      id: d.id,
      fullName: d.fullName,
      email: d.email,
      bloodType: d.bloodType,
      city: d.city,
      donationCount: d._count.donations,
      badges: d.receivedBadges.map((rb) => rb.badge),
    }))
    .sort((a, b) => b.donationCount - a.donationCount)
    .slice(0, 25);

  return NextResponse.json(ranked);
}
