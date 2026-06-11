import { GroupNav } from "@/components/groups/group-nav";
import { TournamentPredictionsClient } from "@/components/groups/tournament-predictions-client";
import { requireAuthenticatedUser, requireGroupAccess } from "@/lib/groups/access";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function BonificacionesPage({ params }: PageProps) {
  const user = await requireAuthenticatedUser();
  const { groupId } = await params;
  const membership = await requireGroupAccess(user.id, groupId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {membership.group.name}
        </h1>
        <p className="text-muted-foreground font-medium select-none">Predicciones Especiales de Torneo</p>
      </div>

      <GroupNav groupId={groupId} active="bonificaciones" />

      <TournamentPredictionsClient groupId={groupId} currentUserId={user.id} />
    </div>
  );
}
