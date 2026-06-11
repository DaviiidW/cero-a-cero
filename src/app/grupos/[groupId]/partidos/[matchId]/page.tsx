import { BackButton } from "@/components/ui/back-button";
import { MatchDetailClient } from "@/components/matches/match-detail-client";
import { requireAuthenticatedUser, requireGroupAccess } from "@/lib/groups/access";

type PageProps = {
  params: Promise<{ groupId: string; matchId: string }>;
};

export default async function MatchDetailPage({ params }: PageProps) {
  const user = await requireAuthenticatedUser();
  const { groupId, matchId } = await params;
  await requireGroupAccess(user.id, groupId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <BackButton />
      </div>

      <MatchDetailClient groupId={groupId} matchId={matchId} />
    </div>
  );
}
