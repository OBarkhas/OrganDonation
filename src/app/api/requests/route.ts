import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { hasCompletedProfile } from "@/lib/utils";
import type {
  BloodType,
  DonationType,
  RequestPriority,
} from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const doctorInclude = {
  doctor: {
    select: {
      fullName: true,
      hospitalName: true,
      city: true,
    },
  },
  targetUser: {
    select: {
      id: true,
      fullName: true,
      bloodType: true,
    },
  },
} as const;

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const rawBloodType = searchParams.get("bloodType");
  const rawType = searchParams.get("type");

  const VALID_BLOOD: BloodType[] = [
    "A_POSITIVE",
    "A_NEGATIVE",
    "B_POSITIVE",
    "B_NEGATIVE",
    "AB_POSITIVE",
    "AB_NEGATIVE",
    "O_POSITIVE",
    "O_NEGATIVE",
  ];
  const VALID_TYPES: DonationType[] = ["BLOOD", "PLASMA", "ORGAN", "TISSUE"];

  if (rawBloodType && !VALID_BLOOD.includes(rawBloodType as BloodType)) {
    return NextResponse.json(
      { error: "Invalid bloodType filter" },
      { status: 400 },
    );
  }
  if (rawType && !VALID_TYPES.includes(rawType as DonationType)) {
    return NextResponse.json({ error: "Invalid type filter" }, { status: 400 });
  }

  const bloodType = (rawBloodType ?? undefined) as BloodType | undefined;
  const type = (rawType ?? undefined) as DonationType | undefined;

  const requests = await db.medicalRequest.findMany({
    where:
      user.role === "DOCTOR"
        ? { doctorId: user.id, ...(type ? { type } : {}) }
        : {
            status: "PENDING",
            OR: [{ targetUserId: null }, { targetUserId: user.id }],
            ...(bloodType ? { bloodType } : {}),
            ...(type ? { type } : {}),
          },
    include: doctorInclude,
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(requests);
}

export async function POST(req: Request) {
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
      { error: "Only doctors can create requests" },
      { status: 403 },
    );
  }
  if (!hasCompletedProfile(user)) {
    return NextResponse.json(
      { error: "Complete your profile to create a request" },
      { status: 403 },
    );
  }

  let body: {
    title?: string;
    description?: string;
    bloodType?: BloodType | null;
    type?: DonationType;
    priority?: RequestPriority;
    hospital?: string;
    targetUserId?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    title,
    description,
    bloodType,
    type,
    priority,
    hospital,
    targetUserId,
  } = body;

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json(
      { error: "Title and description are required" },
      { status: 400 },
    );
  }

  const validTypes: DonationType[] = ["BLOOD", "PLASMA", "ORGAN", "TISSUE"];
  if (!type || !validTypes.includes(type)) {
    return NextResponse.json(
      { error: "Invalid donation type" },
      { status: 400 },
    );
  }

  const validPriorities: RequestPriority[] = [
    "NORMAL",
    "URGENT",
    "EMERGENCY_SOS",
  ];

  let targetUserIdResolved: string | null = null;
  if (targetUserId) {
    const target = await db.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true },
    });
    if (!target || target.role !== "DONOR") {
      return NextResponse.json(
        { error: "Targeted donor not found" },
        { status: 400 },
      );
    }
    targetUserIdResolved = target.id;
  }

  try {
    const request = await db.medicalRequest.create({
      data: {
        doctorId: user.id,
        targetUserId: targetUserIdResolved,
        title: title.trim(),
        description: description.trim(),
        bloodType: bloodType ?? null,
        type,
        priority:
          priority && validPriorities.includes(priority) ? priority : "NORMAL",
        hospital:
          hospital?.trim() || user.hospitalName?.trim() || "General Hospital",
      },
      include: doctorInclude,
    });

    return NextResponse.json(request, { status: 201 });
  } catch (err) {
    console.error("[api/requests] POST failed:", err);
    return NextResponse.json(
      { error: "Could not create request" },
      { status: 500 },
    );
  }
}
