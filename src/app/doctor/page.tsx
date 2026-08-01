import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { toUserDto } from "@/lib/utils";
import { DoctorDashboardView } from "@/components/doctor/DoctorDashboardView";

export default async function DoctorPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "DOCTOR") {
    redirect("/");
  }

  return <DoctorDashboardView user={toUserDto(user)} />;
}
