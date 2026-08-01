import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
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
const VALID_PRIORITIES: RequestPriority[] = [
  "NORMAL",
  "URGENT",
  "EMERGENCY_SOS",
];

/** Fetch the request and verify the signed-in doctor owns it. */
async function getOwnedRequest(id: string) {
  const { userId } = await auth();
  if (!userId) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }
  if (user.role !== "DOCTOR") {
    return {
      error: NextResponse.json(
        { error: "Only doctors can manage requests" },
        { status: 403 },
      ),
    };
  }
  const request = await db.medicalRequest.findUnique({
    where: { id },
    include: doctorInclude,
  });
  if (!request) {
    return { error: NextResponse.json({ error: "Request not found" }, { status: 404 }) };
  }
  if (request.doctorId !== user.id) {
    return {
      error: NextResponse.json(
        { error: "This request does not belong to you" },
        { status: 403 },
      ),
    };
  }
  return { request };
}

/**
 * PATCH /api/requests/[id] — update a doctor's own request.
 * Body: { title?, description?, bloodType?, type?, priority?, hospital? }
 */
export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/requests/[id]">,
) {
  const { id } = await ctx.params;
  const owned = await getOwnedRequest(id);
  if (owned.error) return owned.error;

  let body: {
    title?: string;
    description?: string;
    bloodType?: BloodType | null;
    type?: DonationType;
    priority?: RequestPriority;
    hospital?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, bloodType, type, priority, hospital } = body;
  if (title !== undefined && !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (description !== undefined && !description.trim()) {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 },
    );
  }
  if (bloodType !== undefined && bloodType !== null && !VALID_BLOOD.includes(bloodType)) {
    return NextResponse.json({ error: "Invalid blood type" }, { status: 400 });
  }
  if (type !== undefined && !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid donation type" }, { status: 400 });
  }
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
  }

  try {
    const updated = await db.medicalRequest.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(description !== undefined
          ? { description: description.trim() }
          : {}),
        ...(bloodType !== undefined ? { bloodType } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(hospital !== undefined
          ? { hospital: hospital.trim() || "General Hospital" }
          : {}),
      },
      include: doctorInclude,
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("[api/requests/[id]] PATCH failed:", err);
    return NextResponse.json({ error: "Could not update request" }, { status: 500 });
  }
}

/** DELETE /api/requests/[id] — delete a doctor's own request. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/requests/[id]">) {
  const { id } = await ctx.params;
  const owned = await getOwnedRequest(id);
  if (owned.error) return owned.error;

  try {
    await db.medicalRequest.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/requests/[id]] DELETE failed:", err);
    return NextResponse.json({ error: "Could not delete request" }, { status: 500 });
  }
}
