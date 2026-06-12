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

  if (predictions.length === 0) {
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
  });

  if (recalculate) {
    const affectedGroupIds = Array.from(new Set(predictions.map((p) => p.groupId)));
    if (affectedGroupIds.length > 0) {
      await recalculateGroupRankings(affectedGroupIds);
    }
    await db.$transaction(async (tx) => {
      await recalculateGlobalRanking(tx);
    });
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
