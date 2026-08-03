import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { BloodType } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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
      { error: "Only doctors can search donors" },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(req.url);
  const rawBloodType = searchParams.get("bloodType");
  const city = searchParams.get("city")?.trim() || undefined;
  const q = searchParams.get("q")?.trim() || undefined;
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
  const availableOnly = searchParams.get("available") !== "false";

  if (
    rawBloodType &&
    ![
      "A_POSITIVE",
      "A_NEGATIVE",
      "B_POSITIVE",
      "B_NEGATIVE",
      "AB_POSITIVE",
      "AB_NEGATIVE",
      "O_POSITIVE",
      "O_NEGATIVE",
    ].includes(rawBloodType)
  ) {
    return NextResponse.json(
      { error: "Invalid bloodType filter" },
      { status: 400 },
    );
  }
  const bloodType = (rawBloodType ?? undefined) as BloodType | undefined;

  const donors = await db.user.findMany({
    where: {
      role: "DONOR",
      ...(availableOnly ? { isAvailable: true } : {}),
      ...(bloodType ? { bloodType } : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
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
    },
    orderBy: { fullName: "asc" },
    take: limit,
  });

  return NextResponse.json(donors);
}
