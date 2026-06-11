import { GroupImageEditor } from "@/components/groups/group-image-editor";
import { GroupActions } from "@/components/groups/group-actions";
import { GroupNav } from "@/components/groups/group-nav";
import { InviteInfo } from "@/components/groups/invite-info";
import { requireAuthenticatedUser, requireGroupAccess } from "@/lib/groups/access";
import { getInviteLink, isInviteActive } from "@/lib/invite-code";
import { db } from "@/lib/db";
import { MemberRole } from "@/generated/prisma/client";

type GroupDetailPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const user = await requireAuthenticatedUser();
  const { groupId } = await params;
  const membership = await requireGroupAccess(user.id, groupId);
  const { group } = membership;

  const points = await db.points.findMany({
    where: { groupId },
    orderBy: { points: "desc" },
  });

  const isAdmin = membership.role === MemberRole.ADMIN;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-start gap-4">
        <GroupImageEditor
          groupId={groupId}
          image={group.image}
          name={group.name}
          isAdmin={isAdmin}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">{group.name}</h1>
          <p className="text-muted-foreground">
            Admin: {group.admin.nickGlobal} · {group.members.length} miembros
          </p>
          <p className="text-sm text-muted-foreground">
            Tu nick: {membership.nick}
          </p>
        </div>
      </div>

      <GroupNav groupId={groupId} active="detail" />

      {isAdmin ? (
        <InviteInfo
          groupId={groupId}
          groupName={group.name}
          inviteCode={group.inviteCode}
          inviteLink={getInviteLink(group.inviteCode)}
          inviteActive={isInviteActive(group.inviteExpiresAt)}
          inviteExpiresAt={group.inviteExpiresAt.toISOString()}
        />
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Miembros</h2>
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {group.members.map((member) => {
            const memberPoints =
              points.find((row) => row.userId === member.userId)?.points ?? 0;

            return (
              <li
                key={member.userId}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="font-medium">
                    {member.nick}
                    {member.role === MemberRole.ADMIN ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Admin
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.user.nickGlobal}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {memberPoints} pts
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <GroupActions
        groupId={groupId}
        isAdmin={isAdmin}
        currentUserId={user.id}
        members={group.members.map((member) => ({
          userId: member.userId,
          nick: member.nick,
          role: member.role,
        }))}
      />
    </div>
  );
}
