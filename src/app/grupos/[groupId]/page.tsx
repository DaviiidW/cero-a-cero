import { GroupImageEditor } from "@/components/groups/group-image-editor";
import { GroupActions } from "@/components/groups/group-actions";
import { GroupNav } from "@/components/groups/group-nav";
import { InviteInfo } from "@/components/groups/invite-info";
import { requireAuthenticatedUser, requireGroupAccess } from "@/lib/groups/access";
import { getInviteLink, isInviteActive } from "@/lib/invite-code";
import { MemberRole } from "@/generated/prisma/client";
import { getGroupRanking } from "@/lib/scoring/queries";

type GroupDetailPageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const user = await requireAuthenticatedUser();
  const { groupId } = await params;
  const membership = await requireGroupAccess(user.id, groupId);
  const { group } = membership;

  const ranking = await getGroupRanking(groupId);

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
          {ranking.map((row) => {
            const member = group.members.find((m) => m.userId === row.userId);
            if (!member) return null;

            return (
              <li
                key={member.userId}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="font-medium flex items-center gap-1.5">
                    <span className="text-xs font-black text-muted-foreground select-none">#{row.position}</span>
                    <span>{member.nick}</span>
                    {member.role === MemberRole.ADMIN ? (
                      <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[10px] text-muted-foreground ml-5">
                    {member.user.nickGlobal}
                  </p>
                </div>
                <span className="text-sm font-bold text-foreground">
                  {row.points} pts
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
