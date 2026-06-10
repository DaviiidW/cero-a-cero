import Link from "next/link";
import { GroupNav } from "@/components/groups/group-nav";
import { MatchDetailClient } from "@/components/matches/match-detail-client";
import { requireAuthenticatedUser, requireGroupAccess } from "@/lib/groups/access";

type PageProps = {
  params: Promise<{ groupId: string; matchId: string }>;
};

export default async function MatchDetailPage({ params }: PageProps) {
  const user = await requireAuthenticatedUser();
  const { groupId, matchId } = await params;
  const membership = await requireGroupAccess(user.id, groupId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <Link
          href={`/grupos/${groupId}/partidos`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Volver a partidos
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {membership.group.name}
        </h1>
      </div>

      <GroupNav groupId={groupId} active="partidos" />

      <MatchDetailClient groupId={groupId} matchId={matchId} />
    </div>
  );
}
