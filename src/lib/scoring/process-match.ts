import { MatchStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { calculatePredictionPoints } from "@/lib/scoring/calculate";
import {
  recalculateAllRankings,
  recalculateGroupRankings,
  recalculateGlobalRanking,
} from "@/lib/scoring/ranking-recalc";

export async function processFinishedMatchScoring(matchId: string, recalculate = true) {
  const match = await db.match.findUnique({
    where: { id: matchId },
  });

  if (
    !match ||
    match.status !== MatchStatus.FINISHED ||
    match.homeGoals === null ||
    match.awayGoals === null
  ) {
    return { processed: 0 };
  }

  const predictions = await db.prediction.findMany({
    where: {
      matchId,
      scoredAt: null,
    },
  });

  // If no unscored predictions remain, still recalculate rankings in case a
  // previous run scored predictions but failed before updating the ranking tables.
  if (predictions.length === 0) {
    if (recalculate) {
      // Check if there are any scored predictions for this match to decide
      // whether rankings might be stale (avoids unnecessary work).
      const hasScoredPredictions = await db.prediction.count({
        where: { matchId, scoredAt: { not: null } },
      });
      if (hasScoredPredictions > 0) {
        const affectedGroupIds = await db.prediction
          .findMany({ where: { matchId }, select: { groupId: true } })
          .then((rows) => Array.from(new Set(rows.map((r) => r.groupId))));
        if (affectedGroupIds.length > 0) {
          await recalculateGroupRankings(affectedGroupIds);
        }
        await recalculateGlobalRanking(db);
      }
    }
    return { processed: 0 };
  }

  const actual = {
    homeGoals: match.homeGoals,
    awayGoals: match.awayGoals,
  };

  const scored = predictions.map((prediction) => ({
    prediction,
    pointsEarned: calculatePredictionPoints(prediction, actual),
  }));

  await db.$transaction(async (tx) => {
    for (const { prediction, pointsEarned } of scored) {
      await tx.prediction.update({
        where: { id: prediction.id },
        data: {
          pointsEarned,
          scoredAt: new Date(),
        },
      });

      await tx.points.upsert({
        where: {
          userId_groupId: {
            userId: prediction.userId,
            groupId: prediction.groupId,
          },
        },
        create: {
          userId: prediction.userId,
          groupId: prediction.groupId,
          points: pointsEarned,
        },
        update: {
          points: { increment: pointsEarned },
        },
      });
    }
  }, {
    maxWait: 10000,
    timeout: 30000,
  });

  if (recalculate) {
    const affectedGroupIds = Array.from(new Set(predictions.map((p) => p.groupId)));
    if (affectedGroupIds.length > 0) {
      await recalculateGroupRankings(affectedGroupIds);
    }
    await recalculateGlobalRanking(db);
  }

  return { processed: scored.length };
}

export async function processAllFinishedMatchesScoring() {
  const matches = await db.match.findMany({
    where: {
      status: MatchStatus.FINISHED,
      homeGoals: { not: null },
      awayGoals: { not: null },
      predictions: {
        some: {
          scoredAt: null,
        },
      },
    },
    select: { id: true },
  });

  let totalProcessed = 0;

  for (const match of matches) {
    const result = await processFinishedMatchScoring(match.id, false);
    totalProcessed += result.processed;
  }

  if (matches.length > 0) {
    await recalculateAllRankings();
  }

  return { matchesScored: matches.length, predictionsProcessed: totalProcessed };
}
