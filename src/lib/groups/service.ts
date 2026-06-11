import { MemberRole } from "@/generated/prisma/client";
import {
  DEFAULT_GROUP_IMAGE,
  MAX_GROUP_MEMBERS,
} from "@/lib/constants/groups";
import { db } from "@/lib/db";
import { recalculateGroupRanking, recalculateGlobalRanking } from "@/lib/scoring/ranking-recalc";
import {
  generateUniqueInviteCode,
  getInviteExpiryDate,
  getInviteLink,
  isInviteActive,
  normalizeInviteCode,
} from "@/lib/invite-code";
import { GROUP_ERRORS } from "@/lib/groups/errors";
import { buildRankingWithTies } from "@/lib/scoring/ranking";

type GroupActionError = {
  error: string;
  status: number;
};

export async function getGroupMemberCount(groupId: string): Promise<number> {
  return db.member.count({ where: { groupId } });
}

export async function isGroupMember(
  userId: string,
  groupId: string
): Promise<boolean> {
  const member = await db.member.findUnique({
    where: {
      userId_groupId: { userId, groupId },
    },
    select: { userId: true },
  });

  return Boolean(member);
}

export async function requireGroupMember(userId: string, groupId: string) {
  const member = await db.member.findUnique({
    where: {
      userId_groupId: { userId, groupId },
    },
    include: {
      group: {
        include: {
          admin: {
            select: { id: true, nickGlobal: true },
          },
          members: {
            orderBy: { joinedAt: "asc" },
            include: {
              user: {
                select: { id: true, nickGlobal: true, avatar: true },
              },
            },
          },
        },
      },
    },
  });

  if (!member) {
    return null;
  }

  return member;
}

async function deleteGroupIfEmpty(groupId: string) {
  const count = await getGroupMemberCount(groupId);

  if (count === 0) {
    await db.group.delete({ where: { id: groupId } });
    return true;
  }

  return false;
}

async function deleteGroupIfSingleOrEmpty(groupId: string) {
  const count = await getGroupMemberCount(groupId);

  if (count === 0) {
    await db.group.delete({ where: { id: groupId } });
    return true;
  }

  if (count === 1) {
    await db.member.deleteMany({ where: { groupId } });
    await db.group.delete({ where: { id: groupId } });
    return true;
  }

  return false;
}

async function transferAdminToSecondMember(groupId: string, leavingAdminId: string) {
  const members = await db.member.findMany({
    where: {
      groupId,
      userId: { not: leavingAdminId },
    },
    orderBy: { joinedAt: "asc" },
    take: 1,
  });

  const nextAdmin = members[0];
  if (!nextAdmin) {
    return null;
  }

  await db.$transaction([
    db.group.update({
      where: { id: groupId },
      data: { adminId: nextAdmin.userId },
    }),
    db.member.update({
      where: {
        userId_groupId: {
          userId: nextAdmin.userId,
          groupId,
        },
      },
      data: { role: MemberRole.ADMIN },
    }),
  ]);

  return nextAdmin.userId;
}

export async function createGroup(
  userId: string,
  data: { name: string; image?: string; nick: string }
) {
  const inviteCode = await generateUniqueInviteCode();
  const inviteExpiresAt = getInviteExpiryDate();
  const image = data.image?.trim() || DEFAULT_GROUP_IMAGE;

  const group = await db.$transaction(async (tx) => {
    const created = await tx.group.create({
      data: {
        name: data.name,
        image,
        inviteCode,
        inviteExpiresAt,
        adminId: userId,
      },
    });

    await tx.member.create({
      data: {
        userId,
        groupId: created.id,
        nick: data.nick,
        role: MemberRole.ADMIN,
      },
    });

    await tx.points.create({
      data: {
        userId,
        groupId: created.id,
        points: 0,
      },
    });

    return created;
  });

  await recalculateGroupRanking(group.id);
  await recalculateGlobalRanking();

  return {
    ...group,
    inviteLink: getInviteLink(group.inviteCode),
  };
}

export async function refreshGroupInvite(
  adminUserId: string,
  groupId: string
): Promise<
  | {
      inviteCode: string;
      inviteLink: string;
      inviteExpiresAt: Date;
    }
  | GroupActionError
> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { adminId: true },
  });

  if (!group) {
    return { error: GROUP_ERRORS.NOT_FOUND, status: 404 };
  }

  if (group.adminId !== adminUserId) {
    return { error: GROUP_ERRORS.NOT_ADMIN, status: 403 };
  }

  const inviteCode = await generateUniqueInviteCode();
  const inviteExpiresAt = getInviteExpiryDate();

  const updated = await db.group.update({
    where: { id: groupId },
    data: { inviteCode, inviteExpiresAt },
    select: { inviteCode: true, inviteExpiresAt: true },
  });

  return {
    inviteCode: updated.inviteCode,
    inviteLink: getInviteLink(updated.inviteCode),
    inviteExpiresAt: updated.inviteExpiresAt,
  };
}

export async function findGroupByInviteCode(code: string) {
  const inviteCode = normalizeInviteCode(code);

  return db.group.findUnique({
    where: { inviteCode },
    select: {
      id: true,
      name: true,
      image: true,
      inviteCode: true,
      inviteExpiresAt: true,
      _count: { select: { members: true } },
    },
  });
}

export async function joinGroup(
  userId: string,
  code: string,
  nick: string
): Promise<{ groupId: string } | GroupActionError> {
  const inviteCode = normalizeInviteCode(code);
  const group = await db.group.findUnique({
    where: { inviteCode },
    include: {
      _count: { select: { members: true } },
    },
  });

  if (!group) {
    return { error: GROUP_ERRORS.INVITE_INVALID, status: 404 };
  }

  if (!isInviteActive(group.inviteExpiresAt)) {
    return { error: GROUP_ERRORS.INVITE_EXPIRED, status: 410 };
  }

  if (group._count.members >= MAX_GROUP_MEMBERS) {
    return { error: GROUP_ERRORS.MEMBER_LIMIT, status: 409 };
  }

  const existingMember = await db.member.findUnique({
    where: {
      userId_groupId: { userId, groupId: group.id },
    },
  });

  if (existingMember) {
    return { error: GROUP_ERRORS.ALREADY_MEMBER, status: 409 };
  }

  const nickTaken = await db.member.findFirst({
    where: {
      groupId: group.id,
      nick,
    },
  });

  if (nickTaken) {
    return { error: GROUP_ERRORS.NICK_TAKEN, status: 409 };
  }

  await db.$transaction([
    db.member.create({
      data: {
        userId,
        groupId: group.id,
        nick,
        role: MemberRole.MEMBER,
      },
    }),
    db.points.upsert({
      where: {
        userId_groupId: { userId, groupId: group.id },
      },
      create: {
        userId,
        groupId: group.id,
        points: 0,
      },
      update: {},
    }),
  ]);

  await recalculateGroupRanking(group.id);
  await recalculateGlobalRanking();

  return { groupId: group.id };
}

export async function leaveGroup(
  userId: string,
  groupId: string
): Promise<{ deleted: boolean } | GroupActionError> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!group) {
    return { error: GROUP_ERRORS.NOT_FOUND, status: 404 };
  }

  const member = group.members.find((item) => item.userId === userId);
  if (!member) {
    return { error: GROUP_ERRORS.NOT_MEMBER, status: 403 };
  }

  const isAdmin = group.adminId === userId;
  const remainingCount = group.members.length - 1;

  if (remainingCount === 0) {
    await db.member.delete({
      where: { userId_groupId: { userId, groupId } },
    });
    await db.group.delete({ where: { id: groupId } });
    await recalculateGlobalRanking();
    return { deleted: true };
  }

  if (isAdmin) {
    await transferAdminToSecondMember(groupId, userId);
  }

  await db.member.delete({
    where: { userId_groupId: { userId, groupId } },
  });

  const deleted = await deleteGroupIfSingleOrEmpty(groupId);
  if (!deleted) {
    await recalculateGroupRanking(groupId);
  }
  await recalculateGlobalRanking();
  return { deleted };
}

export async function kickMember(
  adminUserId: string,
  groupId: string,
  targetUserId: string
): Promise<{ success: true } | GroupActionError> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { adminId: true },
  });

  if (!group) {
    return { error: GROUP_ERRORS.NOT_FOUND, status: 404 };
  }

  if (group.adminId !== adminUserId) {
    return { error: GROUP_ERRORS.NOT_ADMIN, status: 403 };
  }

  if (adminUserId === targetUserId) {
    return { error: GROUP_ERRORS.CANNOT_KICK_SELF, status: 400 };
  }

  if (group.adminId === targetUserId) {
    return { error: GROUP_ERRORS.CANNOT_KICK_ADMIN, status: 400 };
  }

  const targetMember = await db.member.findUnique({
    where: {
      userId_groupId: { userId: targetUserId, groupId },
    },
  });

  if (!targetMember) {
    return { error: GROUP_ERRORS.NOT_MEMBER, status: 404 };
  }

  await db.member.delete({
    where: {
      userId_groupId: { userId: targetUserId, groupId },
    },
  });

  const deleted = await deleteGroupIfEmpty(groupId);
  if (!deleted) {
    await recalculateGroupRanking(groupId);
  }
  await recalculateGlobalRanking();
  return { success: true };
}

export async function getUserGroups(userId: string) {
  const memberships = await db.member.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const groupIds = memberships.map((membership) => membership.groupId);

  const allPoints = await db.points.findMany({
    where: { groupId: { in: groupIds } },
    orderBy: [{ groupId: "asc" }, { points: "desc" }],
  });

  return memberships.map((membership) => {
    const groupPoints = allPoints.filter(
      (point) => point.groupId === membership.groupId
    );
    const ranked = buildRankingWithTies(
      groupPoints.map((point) => ({
        userId: point.userId,
        points: point.points,
      }))
    );
    const position =
      ranked.find((row) => row.userId === userId)?.position ?? null;

    return {
      id: membership.group.id,
      name: membership.group.name,
      image: membership.group.image,
      memberCount: membership.group._count.members,
      nick: membership.nick,
      role: membership.role,
      position,
      joinedAt: membership.joinedAt,
    };
  });
}

export function getUserRankInGroup(
  userId: string,
  groupId: string,
  pointsRows: { userId: string; points: number }[]
) {
  const sorted = [...pointsRows].sort((a, b) => b.points - a.points);
  const index = sorted.findIndex((row) => row.userId === userId);
  return index === -1 ? null : index + 1;
}
