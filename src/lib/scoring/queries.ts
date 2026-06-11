import { MatchStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { buildRankingWithTies } from "@/lib/scoring/ranking";

export async function getGroupRanking(groupId: string) {
  // 1. Fetch match points for group members
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

  // 2. Fetch tournament predictions for the group
  const predictions = await db.tournamentPrediction.findMany({
    where: { groupId },
  });
  const predictionsMap = new Map(predictions.map((p) => [p.userId, p]));

  // 3. Fetch tournament result singleton
  const result = await db.tournamentResult.findUnique({
    where: { id: "singleton" },
  });

  // 4. Fetch finished matches and calculate team stats for worst team calculation
  const finishedMatches = await db.match.findMany({
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

  // 5. Fetch exact match counts (3 points predictions)
  const exactCounts = await db.prediction.groupBy({
    by: ["userId"],
    where: {
      groupId,
      pointsEarned: 3,
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
      nick: row.user.memberships[0]?.nick ?? row.user.nickGlobal,
      points: totalPoints, // total points for buildRankingWithTies contract
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

  // Fetch tournament result
  const result = await db.tournamentResult.findUnique({
    where: { id: "singleton" },
  });

  // Fetch team stats
  const finishedMatches = await db.match.findMany({
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

  // Fetch all tournament predictions
  const predictions = await db.tournamentPrediction.findMany();
  const predictionsByUser = new Map<string, typeof predictions>();
  for (const p of predictions) {
    if (!predictionsByUser.has(p.userId)) {
      predictionsByUser.set(p.userId, []);
    }
    predictionsByUser.get(p.userId)!.push(p);
  }

  // Fetch exact match counts globally
  const exactCounts = await db.prediction.groupBy({
    by: ["userId"],
    where: { pointsEarned: 3 },
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
      nick: userMap.get(userId) ?? "—",
      points: totalPoints, // total points for buildRankingWithTies contract
      matchPoints,
      bonusPoints: totalBonusPoints,
      exactCount,
      correctChampionGroups,
    };
  });

  return buildRankingWithTies(entries);
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
