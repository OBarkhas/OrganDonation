import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { toUserDto } from "@/lib/utils";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { AuthShell } from "@/components/auth/AuthShell";

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
