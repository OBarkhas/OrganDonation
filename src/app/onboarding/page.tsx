import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { toUserDto } from "@/lib/utils";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { AuthShell } from "@/components/auth/AuthShell";

/**
 * Profile completion / editing page.
 * - First visit (incomplete profile): user fills in missing details.
 * - Later visits (complete profile): acts as an "Edit Profile" page with
 *   all fields pre-filled from the database.
 */
export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  return (
    <AuthShell>
      <OnboardingForm user={toUserDto(user)} />
    </AuthShell>
  );
}
