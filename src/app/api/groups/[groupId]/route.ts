import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { GROUP_ERRORS } from "@/lib/groups/errors";
import { requireGroupMember } from "@/lib/groups/service";
import { getInviteLink, isInviteActive } from "@/lib/invite-code";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  const { groupId } = await context.params;
  const membership = await requireGroupMember(user.id, groupId);

  if (!membership) {
    return jsonError(GROUP_ERRORS.NOT_MEMBER, 403);
  }

  const { group } = membership;
  const points = await db.points.findMany({
    where: { groupId },
    orderBy: { points: "desc" },
  });

  const userRank =
    points.findIndex((row) => row.userId === user.id) + 1 || null;

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      image: group.image,
      inviteCode: group.inviteCode,
      inviteLink: getInviteLink(group.inviteCode),
      inviteExpiresAt: group.inviteExpiresAt,
      inviteActive: isInviteActive(group.inviteExpiresAt),
      createdAt: group.createdAt,
      admin: group.admin,
      memberCount: group.members.length,
      currentUser: {
        nick: membership.nick,
        role: membership.role,
        position: userRank,
      },
      members: group.members.map((member) => ({
        userId: member.userId,
        nick: member.nick,
        role: member.role,
        joinedAt: member.joinedAt,
        avatar: member.user.avatar,
        nickGlobal: member.user.nickGlobal,
        points:
          points.find((row) => row.userId === member.userId)?.points ?? 0,
      })),
    },
  });
}
