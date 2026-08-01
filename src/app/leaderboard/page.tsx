import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LeaderboardView } from "@/components/leaderboard/LeaderboardView";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <LeaderboardView />
    </div>
  );
}
