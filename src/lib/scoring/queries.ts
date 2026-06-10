import { MatchStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { buildRankingWithTies } from "@/lib/scoring/ranking";

export async function getGroupRanking(groupId: string) {
  const points = await db.points.findMany({
    where: { groupId },
    include: {
      user: {
        select: {
          id: true,
          nickGlobal: true,
          memberships: {
            where: { groupId },
            select: { nick: true },
          },
        },
      },
    },
  });

  const entries = points.map((row) => ({
    userId: row.userId,
    nick: row.user.memberships[0]?.nick ?? row.user.nickGlobal,
    points: row.points,
  }));

  return buildRankingWithTies(entries);
}

export async function getGlobalRanking() {
  const aggregated = await db.points.groupBy({
    by: ["userId"],
    _sum: { points: true },
  });

  const userIds = aggregated.map((row) => row.userId);

  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, nickGlobal: true },
  });

  const userMap = new Map(users.map((user) => [user.id, user.nickGlobal]));

  const entries = aggregated.map((row) => ({
    userId: row.userId,
    nick: userMap.get(row.userId) ?? "—",
    points: row._sum.points ?? 0,
  }));

  return buildRankingWithTies(entries);
}

export async function getUserGroupHistory(userId: string, groupId: string) {
  return db.prediction.findMany({
    where: {
      userId,
      groupId,
      match: {
        status: { in: [MatchStatus.LIVE, MatchStatus.FINISHED] },
      },
    },
    include: {
      match: {
        select: {
          id: true,
          homeTeam: true,
          awayTeam: true,
          homeTeamCrest: true,
          awayTeamCrest: true,
          date: true,
          phase: true,
          homeGoals: true,
          awayGoals: true,
          status: true,
        },
      },
    },
    orderBy: {
      match: { date: "asc" },
    },
  });
}
