import { MatchStatus, Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { buildRankingWithTies } from "@/lib/scoring/ranking";

export interface SharedRecalcData {
  tournamentResult: {
    id: string;
    champion: string | null;
    runnerUp: string | null;
    thirdPlace: string | null;
  } | null;
  teamStats: Map<string, { scored: number; conceded: number }>;
}

export async function fetchSharedRecalcData(tx: Prisma.TransactionClient = db): Promise<SharedRecalcData> {
  const tournamentResult = await tx.tournamentResult.findUnique({
    where: { id: "singleton" },
  });

  const finishedMatches = await tx.match.findMany({
    where: {
      status: MatchStatus.FINISHED,
      homeGoals: { not: null },
      awayGoals: { not: null },
    },
  });

  const teamStats = new Map<string, { scored: number; conceded: number }>();
  for (const m of finishedMatches) {
    const home = m.homeTeam;
    const away = m.awayTeam;
    const hg = m.homeGoals!;
    const ag = m.awayGoals!;

    if (!teamStats.has(home)) teamStats.set(home, { scored: 0, conceded: 0 });
    if (!teamStats.has(away)) teamStats.set(away, { scored: 0, conceded: 0 });

    const homeStat = teamStats.get(home)!;
    homeStat.scored += hg;
    homeStat.conceded += ag;

    const awayStat = teamStats.get(away)!;
    awayStat.scored += ag;
    awayStat.conceded += hg;
  }

  return { tournamentResult, teamStats };
}

export async function calculateGroupRankingInternal(
  groupId: string,
  tx: Prisma.TransactionClient = db,
  sharedData?: SharedRecalcData
) {
  // 1. Fetch match points for group members
  const points = await tx.points.findMany({
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

  // 2. Fetch tournament predictions for the group
  const predictions = await tx.tournamentPrediction.findMany({
    where: { groupId },
  });
  const predictionsMap = new Map(predictions.map((p) => [p.userId, p]));

  // 3. Fetch tournament result singleton
  const result = sharedData
    ? sharedData.tournamentResult
    : await tx.tournamentResult.findUnique({
        where: { id: "singleton" },
      });

  // 4. Fetch finished matches and calculate team stats for worst team calculation
  let teamStats: Map<string, { scored: number; conceded: number }>;
  if (sharedData) {
    teamStats = sharedData.teamStats;
  } else {
    const finishedMatches = await tx.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
        homeGoals: { not: null },
        awayGoals: { not: null },
      },
    });

    teamStats = new Map<string, { scored: number; conceded: number }>();
    for (const m of finishedMatches) {
      const home = m.homeTeam;
      const away = m.awayTeam;
      const hg = m.homeGoals!;
      const ag = m.awayGoals!;

      if (!teamStats.has(home)) teamStats.set(home, { scored: 0, conceded: 0 });
      if (!teamStats.has(away)) teamStats.set(away, { scored: 0, conceded: 0 });

      const homeStat = teamStats.get(home)!;
      homeStat.scored += hg;
      homeStat.conceded += ag;

      const awayStat = teamStats.get(away)!;
      awayStat.scored += ag;
      awayStat.conceded += hg;
    }
  }

  // 5. Fetch exact match counts (4 points predictions)
  const exactCounts = await tx.prediction.groupBy({
    by: ["userId"],
    where: {
      groupId,
      pointsEarned: 4,
    },
    _count: { id: true },
  });
  const exactCountsMap = new Map(exactCounts.map((row) => [row.userId, row._count.id]));

  // 6. Map points to entries with bonus calculation
  const entries = points.map((row) => {
    const pred = predictionsMap.get(row.userId);
    const exactCount = exactCountsMap.get(row.userId) ?? 0;

    let championPoints = 0;
    let runnerUpPoints = 0;
    let thirdPlacePoints = 0;
    let worstTeamPoints = 0;
    let championCorrect = false;

    if (pred) {
      if (result) {
        if (result.champion && pred.champion === result.champion) {
          championPoints = 10;
          championCorrect = true;
        }
        if (result.runnerUp && pred.runnerUp === result.runnerUp) {
          runnerUpPoints = 8;
        }
        if (result.thirdPlace && pred.thirdPlace === result.thirdPlace) {
          thirdPlacePoints = 6;
        }
      }

      if (pred.worstTeam) {
        const stats = teamStats.get(pred.worstTeam);
        if (stats) {
          worstTeamPoints = Math.floor(stats.conceded / 3) - stats.scored;
        }
      }
    }

    const bonusPoints = championPoints + runnerUpPoints + thirdPlacePoints + worstTeamPoints;
    const totalPoints = row.points + bonusPoints;

    return {
      userId: row.userId,
      points: totalPoints,
      matchPoints: row.points,
      bonusPoints,
      championPoints,
      runnerUpPoints,
      thirdPlacePoints,
      worstTeamPoints,
      exactCount,
      championCorrect,
    };
  });

  return buildRankingWithTies(entries);
}

export async function calculateGlobalRankingInternal(
  tx: Prisma.TransactionClient = db,
  sharedData?: SharedRecalcData
) {
  const aggregated = await tx.points.groupBy({
    by: ["userId"],
    _sum: { points: true },
  });

  // Fetch tournament result
  const result = sharedData
    ? sharedData.tournamentResult
    : await tx.tournamentResult.findUnique({
        where: { id: "singleton" },
      });

  // Fetch team stats
  let teamStats: Map<string, { scored: number; conceded: number }>;
  if (sharedData) {
    teamStats = sharedData.teamStats;
  } else {
    const finishedMatches = await tx.match.findMany({
      where: {
        status: MatchStatus.FINISHED,
        homeGoals: { not: null },
        awayGoals: { not: null },
      },
    });

    teamStats = new Map<string, { scored: number; conceded: number }>();
    for (const m of finishedMatches) {
      const home = m.homeTeam;
      const away = m.awayTeam;
      const hg = m.homeGoals!;
      const ag = m.awayGoals!;

      if (!teamStats.has(home)) teamStats.set(home, { scored: 0, conceded: 0 });
      if (!teamStats.has(away)) teamStats.set(away, { scored: 0, conceded: 0 });

      const homeStat = teamStats.get(home)!;
      homeStat.scored += hg;
      homeStat.conceded += ag;

      const awayStat = teamStats.get(away)!;
      awayStat.scored += ag;
      awayStat.conceded += hg;
    }
  }

  // Fetch all tournament predictions
  const predictions = await tx.tournamentPrediction.findMany();
  const predictionsByUser = new Map<string, typeof predictions>();
  for (const p of predictions) {
    if (!predictionsByUser.has(p.userId)) {
      predictionsByUser.set(p.userId, []);
    }
    predictionsByUser.get(p.userId)!.push(p);
  }

  // Fetch exact match counts globally
  const exactCounts = await tx.prediction.groupBy({
    by: ["userId"],
    where: { pointsEarned: 4 },
    _count: { id: true },
  });
  const exactCountsMap = new Map(exactCounts.map((row) => [row.userId, row._count.id]));

  const entries = aggregated.map((row) => {
    const userId = row.userId;
    const matchPoints = row._sum.points ?? 0;
    const exactCount = exactCountsMap.get(userId) ?? 0;

    const userPreds = predictionsByUser.get(userId) ?? [];
    let totalBonusPoints = 0;
    let correctChampionGroups = 0;

    for (const pred of userPreds) {
      let championPoints = 0;
      let runnerUpPoints = 0;
      let thirdPlacePoints = 0;
      let worstTeamPoints = 0;

      if (result) {
        if (result.champion && pred.champion === result.champion) {
          championPoints = 10;
          correctChampionGroups++;
        }
        if (result.runnerUp && pred.runnerUp === result.runnerUp) {
          runnerUpPoints = 8;
        }
        if (result.thirdPlace && pred.thirdPlace === result.thirdPlace) {
          thirdPlacePoints = 6;
        }
      }

      if (pred.worstTeam) {
        const stats = teamStats.get(pred.worstTeam);
        if (stats) {
          worstTeamPoints = Math.floor(stats.conceded / 3) - stats.scored;
        }
      }

      totalBonusPoints += (championPoints + runnerUpPoints + thirdPlacePoints + worstTeamPoints);
    }

    const totalPoints = matchPoints + totalBonusPoints;

    return {
      userId,
      points: totalPoints,
      matchPoints,
      bonusPoints: totalBonusPoints,
      exactCount,
      correctChampionGroups,
    };
  });

  return buildRankingWithTies(entries);
}

export async function recalculateGroupRanking(
  groupId: string,
  tx: Prisma.TransactionClient = db,
  sharedData?: SharedRecalcData
) {
  const ranking = await calculateGroupRankingInternal(groupId, tx, sharedData);

  // Clean old rankings for this group
  await tx.groupRanking.deleteMany({
    where: { groupId },
  });

  // Bulk insert new rankings
  if (ranking.length > 0) {
    await tx.groupRanking.createMany({
      data: ranking.map((entry) => ({
        groupId,
        userId: entry.userId,
        position: entry.position,
        points: entry.points,
        matchPoints: entry.matchPoints,
        bonusPoints: entry.bonusPoints,
        championPoints: entry.championPoints,
        runnerUpPoints: entry.runnerUpPoints,
        thirdPlacePoints: entry.thirdPlacePoints,
        worstTeamPoints: entry.worstTeamPoints,
        exactCount: entry.exactCount,
        championCorrect: entry.championCorrect,
      })),
    });
  }
}

export async function recalculateGlobalRanking(
  tx: Prisma.TransactionClient = db,
  sharedData?: SharedRecalcData
) {
  const ranking = await calculateGlobalRankingInternal(tx, sharedData);

  // Clean old rankings
  await tx.globalRanking.deleteMany();

  // Bulk insert new rankings
  if (ranking.length > 0) {
    await tx.globalRanking.createMany({
      data: ranking.map((entry) => ({
        userId: entry.userId,
        position: entry.position,
        points: entry.points,
        matchPoints: entry.matchPoints,
        bonusPoints: entry.bonusPoints,
        exactCount: entry.exactCount,
        correctChampionGroups: entry.correctChampionGroups,
      })),
    });
  }
}

export async function recalculateGroupRankings(groupIds: string[]) {
  if (groupIds.length === 0) return;

  const sharedData = await fetchSharedRecalcData(db);

  for (const groupId of groupIds) {
    await db.$transaction(async (tx) => {
      await recalculateGroupRanking(groupId, tx, sharedData);
    });
  }
}

export async function recalculateAllRankings() {
  const sharedData = await fetchSharedRecalcData(db);

  // 1. Fetch all groups
  const groups = await db.group.findMany({ select: { id: true } });

  // 2. Recalculate each group ranking inside its own transaction
  for (const g of groups) {
    await db.$transaction(async (tx) => {
      await recalculateGroupRanking(g.id, tx, sharedData);
    });
  }

  // 3. Recalculate global ranking inside its own transaction
  await db.$transaction(async (tx) => {
    await recalculateGlobalRanking(tx, sharedData);
  });
}
