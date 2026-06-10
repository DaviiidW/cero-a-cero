import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-admin";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { processFinishedMatchScoring } from "@/lib/scoring/process-match";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return jsonError("No autorizado", 401);
  }

  const { id } = await context.params;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo de solicitud inválido", 400);
  }

  const {
    homeTeam,
    awayTeam,
    homeTeamCrest,
    awayTeamCrest,
    date,
    phase,
    groupStageNumber,
    jornada,
    status,
    homeGoals,
    awayGoals,
  } = body;

  try {
    const existing = await db.match.findUnique({
      where: { id },
    });

    if (!existing) {
      return jsonError("Partido no encontrado", 404);
    }

    const updated = await db.match.update({
      where: { id },
      data: {
        homeTeam: homeTeam !== undefined ? homeTeam : existing.homeTeam,
        awayTeam: awayTeam !== undefined ? awayTeam : existing.awayTeam,
        homeTeamCrest: homeTeamCrest !== undefined ? homeTeamCrest : existing.homeTeamCrest,
        awayTeamCrest: awayTeamCrest !== undefined ? awayTeamCrest : existing.awayTeamCrest,
        date: date !== undefined ? new Date(date) : existing.date,
        phase: phase !== undefined ? phase : existing.phase,
        groupStageNumber: groupStageNumber !== undefined ? (groupStageNumber ? parseInt(groupStageNumber, 10) : null) : existing.groupStageNumber,
        jornada: jornada !== undefined ? parseInt(jornada, 10) : existing.jornada,
        status: status !== undefined ? status : existing.status,
        homeGoals: homeGoals !== undefined ? (homeGoals !== null && homeGoals !== "" ? parseInt(homeGoals, 10) : null) : existing.homeGoals,
        awayGoals: awayGoals !== undefined ? (awayGoals !== null && awayGoals !== "" ? parseInt(awayGoals, 10) : null) : existing.awayGoals,
      },
    });

    // HU-02 y HU-12: Si el partido se marca como FINISHED, puntuar las predicciones de los usuarios de inmediato
    if (updated.status === "FINISHED" && updated.homeGoals !== null && updated.awayGoals !== null) {
      await processFinishedMatchScoring(updated.id);
    }

    return NextResponse.json({ match: updated, message: "Partido actualizado correctamente" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al actualizar el partido";
    return jsonError(message, 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return jsonError("No autorizado", 401);
  }

  const { id } = await context.params;

  try {
    const existing = await db.match.findUnique({
      where: { id },
    });

    if (!existing) {
      return jsonError("Partido no encontrado", 404);
    }

    await db.match.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Partido eliminado correctamente" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al eliminar el partido";
    return jsonError(message, 500);
  }
}
