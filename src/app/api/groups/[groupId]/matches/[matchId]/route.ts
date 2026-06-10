import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { GROUP_ERRORS } from "@/lib/groups/errors";
import { isGroupMember } from "@/lib/groups/service";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ groupId: string; matchId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  const { groupId, matchId } = await context.params;
  const member = await isGroupMember(user.id, groupId);

  if (!member) {
    return jsonError(GROUP_ERRORS.NOT_MEMBER, 403);
  }

  const match = await db.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    return jsonError("Partido no encontrado", 404);
  }

  const prediction = await db.prediction.findUnique({
    where: {
      userId_matchId_groupId: {
        userId: user.id,
        matchId,
        groupId,
      },
    },
  });

  // HU-05 y HU-07: Si el partido está "LIVE" o "FINISHED", mostramos las predicciones del grupo
  const isVisibleForGroup = match.status === "LIVE" || match.status === "FINISHED";
  let formattedGroupPredictions: any[] = [];

  if (isVisibleForGroup) {
    const groupPredictions = await db.prediction.findMany({
      where: {
        matchId,
        groupId,
      },
      select: {
        id: true,
        userId: true,
        predictionHomeGoals: true,
        predictionAwayGoals: true,
        resultType: true,
        pointsEarned: true,
        user: {
          select: {
            nickGlobal: true,
            memberships: {
              where: { groupId },
              select: { nick: true },
            },
          },
        },
      },
    });

    formattedGroupPredictions = groupPredictions.map((pred) => ({
      userId: pred.userId,
      nick: pred.user.memberships[0]?.nick || pred.user.nickGlobal,
      predictionHomeGoals: pred.predictionHomeGoals,
      predictionAwayGoals: pred.predictionAwayGoals,
      resultType: pred.resultType,
      pointsEarned: pred.pointsEarned,
    }));
  }

  return NextResponse.json({
    match,
    prediction,
    groupPredictions: formattedGroupPredictions,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  const { groupId, matchId } = await context.params;
  const member = await isGroupMember(user.id, groupId);

  if (!member) {
    return jsonError(GROUP_ERRORS.NOT_MEMBER, 403);
  }

  const match = await db.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    return jsonError("Partido no encontrado", 404);
  }

  // HU-02 y HU-03: Bloqueo de predicciones 5 minutos antes del partido
  const now = new Date();
  const lockTime = new Date(match.date.getTime() - 5 * 60 * 1000);
  if (now >= lockTime) {
    return jsonError("Predicciones bloqueadas. Faltan menos de 5 minutos para el partido.", 400);
  }

  // HU-10: Validación de consistencia
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo de solicitud inválido", 400);
  }

  const homeGoals = parseInt(body.predictionHomeGoals, 10);
  const awayGoals = parseInt(body.predictionAwayGoals, 10);

  if (isNaN(homeGoals) || isNaN(awayGoals) || homeGoals < 0 || awayGoals < 0) {
    return jsonError("Los goles deben ser números enteros mayores o iguales a 0", 400);
  }

  let resultType: "HOME" | "DRAW" | "AWAY" = "DRAW";
  if (homeGoals > awayGoals) {
    resultType = "HOME";
  } else if (homeGoals < awayGoals) {
    resultType = "AWAY";
  }

  // HU-09: Evitar duplicidad (usando findUnique y upsert/update en transacción)
  const existing = await db.prediction.findUnique({
    where: {
      userId_matchId_groupId: {
        userId: user.id,
        matchId,
        groupId,
      },
    },
  });

  const prediction = await db.$transaction(async (tx) => {
    if (existing) {
      const updated = await tx.prediction.update({
        where: { id: existing.id },
        data: {
          predictionHomeGoals: homeGoals,
          predictionAwayGoals: awayGoals,
          resultType,
        },
      });

      // HU-13: Auditoría (registro de edición)
      await tx.predictionHistory.create({
        data: {
          predictionId: existing.id,
          userId: user.id,
          matchId,
          groupId,
          predictionHomeGoals: homeGoals,
          predictionAwayGoals: awayGoals,
          action: "UPDATE",
        },
      });

      return updated;
    } else {
      const created = await tx.prediction.create({
        data: {
          userId: user.id,
          matchId,
          groupId,
          predictionHomeGoals: homeGoals,
          predictionAwayGoals: awayGoals,
          resultType,
        },
      });

      // HU-13: Auditoría (registro de creación)
      await tx.predictionHistory.create({
        data: {
          predictionId: created.id,
          userId: user.id,
          matchId,
          groupId,
          predictionHomeGoals: homeGoals,
          predictionAwayGoals: awayGoals,
          action: "CREATE",
        },
      });

      return created;
    }
  });

  return NextResponse.json({
    prediction,
    message: "Predicción guardada correctamente",
  });
}

