"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

export async function ensureUserWithRole(preferredRole: Role = "DONOR") {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Clerk user not found");

  const email = clerkUser.emailAddresses[0]?.emailAddress || "";
  const fullName =
    `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
    "New User";
  const resolveRole = (current: Role): Role =>
    preferredRole === "DOCTOR" && current === "DONOR" ? "DOCTOR" : current;
  let existingUser = await db.user.findUnique({
    where: { clerkUserId: userId },
  });
  if (!existingUser && email) {
    existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return await db.user.update({
        where: { id: existingUser.id },
        data: {
          clerkUserId: userId,
          fullName,
          role: resolveRole(existingUser.role),
        },
      });
    }
  }
  if (existingUser) {
    return await db.user.update({
      where: { id: existingUser.id },
      data: {
        email,
        fullName,
        role: resolveRole(existingUser.role),
      },
    });
  }
  try {
    return await db.user.create({
      data: {
        clerkUserId: userId,
        email,
        fullName,
        role: preferredRole,
      },
    });
  } catch (err) {
    const isUniqueViolation =
      err instanceof Error && (err as { code?: unknown }).code === "P2002";
    if (isUniqueViolation) {
      const raced = await db.user.findUnique({
        where: { clerkUserId: userId },
      });
      if (raced) return raced;
      if (email) {
        const byEmail = await db.user.findUnique({ where: { email } });
        if (byEmail) return byEmail;
      }
    }
    throw err;
  }
}

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (existing) return existing;
  try {
    return await ensureUserWithRole("DONOR");
  } catch (err) {
    console.error("[auth] self-heal sync failed:", err);
    return null;
  }
}
