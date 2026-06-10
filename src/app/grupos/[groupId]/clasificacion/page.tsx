import { GroupNav } from "@/components/groups/group-nav";
import { requireAuthenticatedUser, requireGroupAccess } from "@/lib/groups/access";
import { db } from "@/lib/db";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function ClasificacionPage({ params }: PageProps) {
  const user = await requireAuthenticatedUser();
  const { groupId } = await params;
  const membership = await requireGroupAccess(user.id, groupId);

  const points = await db.points.findMany({
    where: { groupId },
    orderBy: { points: "desc" },
    include: {
      user: {
        select: {
          id: true,
          memberships: {
            where: { groupId },
            select: { nick: true },
          },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          {membership.group.name}
        </h1>
        <p className="text-muted-foreground">Clasificación del grupo</p>
      </div>

      <GroupNav groupId={groupId} active="clasificacion" />

      <ol className="divide-y divide-border rounded-2xl border border-border">
        {points.map((row, index) => (
          <li
            key={row.userId}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-muted-foreground">#{index + 1}</span>
              <span className="font-medium">
                {row.user.memberships[0]?.nick ?? "—"}
              </span>
            </div>
            <span>{row.points} pts</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
