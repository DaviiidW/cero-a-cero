import { GlobalRankingClient } from "@/components/ranking/global-ranking-client";
import { requireAuthenticatedUser } from "@/lib/groups/access";

export default async function RankingPage() {
  const user = await requireAuthenticatedUser();

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
