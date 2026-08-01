import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { toUserDto } from "@/lib/utils";
import { LandingView } from "@/components/landing/LandingView";
import { DonorHomeView } from "@/components/donor/DonorHomeView";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user?.role === "DOCTOR") {
    redirect("/doctor");
  }

  if (!user) {
    return <LandingView />;
  }

  return <DonorHomeView user={toUserDto(user)} />;
}
