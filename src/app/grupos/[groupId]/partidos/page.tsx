import { GroupNav } from "@/components/groups/group-nav";
import { requireAuthenticatedUser, requireGroupAccess } from "@/lib/groups/access";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function PartidosPage({ params }: PageProps) {
  const user = await requireAuthenticatedUser();
  const { groupId } = await params;
  const membership = await requireGroupAccess(user.id, groupId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {membership.group.name}
        </h1>
        <p className="text-muted-foreground">Partidos del grupo</p>
      </div>

      <GroupNav groupId={groupId} active="partidos" />

      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
        Los partidos estarán disponibles próximamente.
      </div>
    </div>
  );
}
