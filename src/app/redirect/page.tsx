import { redirect } from "next/navigation";
import { ensureUserWithRole } from "@/lib/auth";
import { hasCompletedProfile } from "@/lib/utils";

export default async function RedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const normalized = role === "DOCTOR" ? "DOCTOR" : "DONOR";
  const user = await ensureUserWithRole(normalized).catch((err) => {
    console.error("[redirect] sync failed:", err);
    return null;
  });

  if (!user) {
    redirect("/");
  }
  if (!hasCompletedProfile(user)) {
    redirect("/onboarding");
  }
  if (user.role === "DOCTOR") {
    redirect("/doctor");
  }
  redirect("/");
}
