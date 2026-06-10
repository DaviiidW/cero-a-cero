import { GroupNav } from "@/components/groups/group-nav";
import { HistoryListClient } from "@/components/history/history-list-client";
import { requireAuthenticatedUser, requireGroupAccess } from "@/lib/groups/access";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function PrediccionesPage({ params }: PageProps) {
  const user = await requireAuthenticatedUser();
  const { groupId } = await params;
  const membership = await requireGroupAccess(user.id, groupId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {membership.group.name}
        </h1>
        <p className="text-muted-foreground">
          Historial de predicciones y puntuación
        </p>
      </div>

      <GroupNav groupId={groupId} active="predicciones" />

      <HistoryListClient groupId={groupId} />
    </div>
  );
}
