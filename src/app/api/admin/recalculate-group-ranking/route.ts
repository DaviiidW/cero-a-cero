import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-admin";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { calculatePredictionPoints } from "@/lib/scoring/calculate";
import { recalculateGroupRankings } from "@/lib/scoring/ranking-recalc";

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return jsonError("No autorizado", 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo de solicitud inválido", 400);
  }

  const { groupId, type } = body;
  if (!groupId) {
    return jsonError("El campo groupId es obligatorio", 400);
  }
  if (type !== "matches" && type !== "specials") {
    return jsonError("Tipo de recalculo inválido (debe ser 'matches' o 'specials')", 400);
  }

  // Verify group exists
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true, name: true },
  });

  if (!group) {
    return jsonError("Grupo no encontrado", 404);
  }

  try {
    const start = Date.now();

    if (type === "matches") {
      // Recalculate match prediction points for this group only
      await db.$transaction(async (tx) => {
        // 1. Reset all prediction points for this group
        await tx.prediction.updateMany({
          where: { groupId },
          data: {
            pointsEarned: null,
            scoredAt: null,
          },
        });

        // 2. Reset all Points entries for this group to 0
        await tx.points.updateMany({
          where: { groupId },
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

        // 4. Recalculate predictions for this group and each finished match
        for (const match of finishedMatches) {
          const predictions = await tx.prediction.findMany({
            where: { matchId: match.id, groupId },
          });

          const actual = {
            homeGoals: match.homeGoals!,
            awayGoals: match.awayGoals!,
            jornada: match.jornada,
            qualifyingTeam: match.qualifyingTeam,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
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
                  groupId,
                },
              },
              create: {
                userId: prediction.userId,
                groupId,
                points: pointsEarned,
              },
              update: {
                points: { increment: pointsEarned },
              },
            });
          }
        }
      }, {
        maxWait: 15000,
        timeout: 60000,
      });
    }

    // Always recalculate standings for the group at the end
    await recalculateGroupRankings([groupId]);
    const duration = Date.now() - start;

    const actionText = type === "matches" ? "predicciones de partidos" : "predicciones especiales";
    return NextResponse.json({
      success: true,
      message: `Puntos de ${actionText} para el grupo "${group.name}" recalculados correctamente en ${duration} ms.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al recalcular la clasificación";
    return jsonError(message, 500);
  }
}
