import { GlobalRankingClient } from "@/components/ranking/global-ranking-client";
import { requireAuthenticatedUser } from "@/lib/groups/access";
import { getUserGroups } from "@/lib/groups/service";
import { redirect } from "next/navigation";

export default async function RankingPage() {
  const user = await requireAuthenticatedUser();
  const groups = await getUserGroups(user.id);

  if (groups.length === 0) {
    redirect("/grupos");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Ranking global
        </h1>
        <p className="text-muted-foreground">
          Puntuación total acumulada en todos los grupos
        </p>
      </div>

      <GlobalRankingClient currentUserId={user.id} />
    </div>
  );
}
