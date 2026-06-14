import { db } from "@/lib/db";
import { buildRankingWithTies } from "@/lib/scoring/ranking";

export async function getGroupRanking(groupId: string, jornadaFilter?: number | number[]) {
  if (jornadaFilter !== undefined) {
    // 1. Fetch all group members
    const members = await db.member.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            nickGlobal: true,
          },
        },
      },
    });

    // 2. Fetch predictions matching the jornada filter
    const matchWhereClause: { jornada?: number | { in: number[] } } = {};
    if (Array.isArray(jornadaFilter)) {
      matchWhereClause.jornada = { in: jornadaFilter };
    } else {
      matchWhereClause.jornada = jornadaFilter;
    }

    const predictions = await db.prediction.findMany({
      where: {
        groupId,
        pointsEarned: { not: null },
        match: matchWhereClause,
      },
      select: {
        userId: true,
        pointsEarned: true,
      },
    });

    // 3. Map values to sum points and count exact matches
    const pointsMap = new Map<string, number>();
    const exactCountsMap = new Map<string, number>();

    for (const pred of predictions) {
      const userId = pred.userId;
      const pts = pred.pointsEarned ?? 0;
      pointsMap.set(userId, (pointsMap.get(userId) ?? 0) + pts);
      if (pts === 4) {
        exactCountsMap.set(userId, (exactCountsMap.get(userId) ?? 0) + 1);
      }
    }

    // 4. Construct entries for ranking
    const entries = members.map((member) => {
      const userId = member.userId;
      const matchPoints = pointsMap.get(userId) ?? 0;
      const exactCount = exactCountsMap.get(userId) ?? 0;

      return {
        userId,
        nick: member.nick,
        points: matchPoints,
        matchPoints,
        bonusPoints: 0,
        championPoints: 0,
        runnerUpPoints: 0,
        thirdPlacePoints: 0,
        worstTeamPoints: 0,
        exactCount,
        championCorrect: false,
      };
    });

    return { rows: buildRankingWithTies(entries).slice(0, 30), updatedAt: null };
  }

  // Query precalculated GroupRanking table ordered by position
  const rankings = await db.groupRanking.findMany({
    where: { groupId },
    orderBy: { position: "asc" },
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

  // The most recent updatedAt across all rows is the last recalculation time
  const lastUpdatedAt = rankings.length > 0
    ? rankings.reduce((latest, r) => r.updatedAt > latest ? r.updatedAt : latest, rankings[0].updatedAt)
    : null;

  return {
    rows: rankings.map((r) => ({
      userId: r.userId,
      nick: r.user.memberships[0]?.nick ?? r.user.nickGlobal,
      points: r.points,
      matchPoints: r.matchPoints,
      bonusPoints: r.bonusPoints,
      championPoints: r.championPoints,
      runnerUpPoints: r.runnerUpPoints,
      thirdPlacePoints: r.thirdPlacePoints,
      worstTeamPoints: r.worstTeamPoints,
      exactCount: r.exactCount,
      championCorrect: r.championCorrect,
      position: r.position,
    })),
    updatedAt: lastUpdatedAt,
  };
}

export async function getGlobalRanking(jornadaFilter?: number | number[]) {
  if (jornadaFilter !== undefined) {
    // 1. Fetch all users in the system
    const users = await db.user.findMany({
      select: { id: true, nickGlobal: true },
    });

    // 2. Fetch predictions matching the filter
    const matchWhereClause: { jornada?: number | { in: number[] } } = {};
    if (Array.isArray(jornadaFilter)) {
      matchWhereClause.jornada = { in: jornadaFilter };
    } else {
      matchWhereClause.jornada = jornadaFilter;
    }

    const predictions = await db.prediction.findMany({
      where: {
        pointsEarned: { not: null },
        match: matchWhereClause,
      },
      select: {
        userId: true,
        pointsEarned: true,
      },
    });

    // 3. Map values to sum points and count exact matches
    const pointsMap = new Map<string, number>();
    const exactCountsMap = new Map<string, number>();

    for (const pred of predictions) {
      const userId = pred.userId;
      const pts = pred.pointsEarned ?? 0;
      pointsMap.set(userId, (pointsMap.get(userId) ?? 0) + pts);
      if (pts === 4) {
        exactCountsMap.set(userId, (exactCountsMap.get(userId) ?? 0) + 1);
      }
    }

    // 4. Construct entries for ranking
    const entries = users.map((user) => {
      const userId = user.id;
      const matchPoints = pointsMap.get(userId) ?? 0;
      const exactCount = exactCountsMap.get(userId) ?? 0;

      return {
        userId,
        nick: user.nickGlobal,
        points: matchPoints,
        matchPoints,
        bonusPoints: 0,
        exactCount,
        correctChampionGroups: 0,
      };
    });

    return { rows: buildRankingWithTies(entries).slice(0, 30), updatedAt: null };
  }

  // Query precalculated GlobalRanking table ordered by position (top 30 only)
  const rankings = await db.globalRanking.findMany({
    orderBy: { position: "asc" },
    take: 30,
    include: {
      user: {
        select: {
          id: true,
          nickGlobal: true,
        },
      },
    },
  });

  const lastUpdatedAt = rankings.length > 0
    ? rankings.reduce((latest, r) => r.updatedAt > latest ? r.updatedAt : latest, rankings[0].updatedAt)
    : null;

  return {
    rows: rankings.map((r) => ({
      userId: r.userId,
      nick: r.user.nickGlobal,
      points: r.points,
      matchPoints: r.matchPoints,
      bonusPoints: r.bonusPoints,
      exactCount: r.exactCount,
      correctChampionGroups: r.correctChampionGroups,
      position: r.position,
    })),
    updatedAt: lastUpdatedAt,
  };
}

export async function getUserGroupHistory(userId: string, groupId: string) {
  return db.prediction.findMany({
    where: {
      userId,
      groupId,
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
