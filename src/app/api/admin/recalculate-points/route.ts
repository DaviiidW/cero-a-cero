import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-admin";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { calculatePredictionPoints } from "@/lib/scoring/calculate";
import { recalculateAllRankings } from "@/lib/scoring/ranking-recalc";

export async function POST() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return jsonError("No autorizado", 401);
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Reset all prediction points
      await tx.prediction.updateMany({
        data: {
          pointsEarned: null,
          scoredAt: null,
        },
      });

      // 2. Reset all Points entries to 0
      await tx.points.updateMany({
        data: {
          points: 0,
        },
      });

      // 3. Find all finished matches
      const finishedMatches = await tx.match.findMany({
        where: {
          status: "FINISHED",
          homeGoals: { not: null },
          awayGoals: { not: null },
        },
      });

      let updatedPredictionsCount = 0;

      // 4. Recalculate for each finished match
      for (const match of finishedMatches) {
        const predictions = await tx.prediction.findMany({
          where: { matchId: match.id },
        });

        const actual = {
          homeGoals: match.homeGoals!,
          awayGoals: match.awayGoals!,
        };

        for (const prediction of predictions) {
          const pointsEarned = calculatePredictionPoints(prediction, actual);

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

          updatedPredictionsCount++;
        }
      }

      return {
        matchesProcessed: finishedMatches.length,
        predictionsProcessed: updatedPredictionsCount,
      };
    });

    await recalculateAllRankings();

    return NextResponse.json({
      success: true,
      message: "Puntos recalculados correctamente",
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al recalcular puntos";
    return jsonError(message, 500);
  }
}
