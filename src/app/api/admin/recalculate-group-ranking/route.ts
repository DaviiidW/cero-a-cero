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

  const { groupId, type, userId } = body;
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
      // 1. Find all finished matches
      const finishedMatches = await db.match.findMany({
        where: {
          status: "FINISHED",
          homeGoals: { not: null },
          awayGoals: { not: null },
        },
      });

      const finishedMatchesMap = new Map(finishedMatches.map((m) => [m.id, m]));

      // 2. Fetch predictions for this group (optionally filtered by user)
      const predictions = await db.prediction.findMany({
        where: { 
          groupId,
          ...(userId ? { userId } : {}),
        },
      });

      // 3. Compute in-memory points and group prediction updates
      const userTotalPoints = new Map<string, number>();
      const groupedPredictionIds = new Map<number, string[]>();

      for (const prediction of predictions) {
        const match = finishedMatchesMap.get(prediction.matchId);
        if (!match) continue;

        const actual = {
          homeGoals: match.homeGoals!,
          awayGoals: match.awayGoals!,
          jornada: match.jornada,
          qualifyingTeam: match.qualifyingTeam,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
        };

        const pointsEarned = calculatePredictionPoints(prediction, actual);

        // Accumulate user total points for matches
        userTotalPoints.set(
          prediction.userId,
          (userTotalPoints.get(prediction.userId) ?? 0) + pointsEarned
        );

        // Group prediction IDs by points earned
        if (!groupedPredictionIds.has(pointsEarned)) {
          groupedPredictionIds.set(pointsEarned, []);
        }
        groupedPredictionIds.get(pointsEarned)!.push(prediction.id);
      }

      // 4. Batch updates inside a transaction
      await db.$transaction(async (tx) => {
        // Reset predictions for this group (optionally filtered by user)
        await tx.prediction.updateMany({
          where: { 
            groupId,
            ...(userId ? { userId } : {}),
          },
          data: {
            pointsEarned: null,
            scoredAt: null,
          },
        });

        // Reset user Points table records for this group to 0 (optionally filtered by user)
        await tx.points.updateMany({
          where: { 
            groupId,
            ...(userId ? { userId } : {}),
          },
          data: {
            points: 0,
          },
        });

        // Bulk update predictions grouped by points
        for (const [points, ids] of groupedPredictionIds.entries()) {
          if (ids.length === 0) continue;
          await tx.prediction.updateMany({
            where: { id: { in: ids } },
            data: {
              pointsEarned: points,
              scoredAt: new Date(),
            },
          });
        }

        // Upsert cumulative points for each user in this group
        for (const [uid, total] of userTotalPoints.entries()) {
          await tx.points.upsert({
            where: {
              userId_groupId: {
                userId: uid,
                groupId,
              },
            },
            create: {
              userId: uid,
              groupId,
              points: total,
            },
            update: {
              points: total,
            },
          });
        }
      }, {
        maxWait: 10000,
        timeout: 20000,
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
