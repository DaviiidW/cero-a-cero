import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-admin";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { parseMadridTimeToUTC } from "@/lib/date-timezone";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return jsonError("No autorizado", 401);
  }

  const matches = await db.match.findMany({
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ matches });
}

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
    qualifyingTeam,
  } = body;

  if (!homeTeam || !awayTeam || !date || !phase || !jornada) {
    return jsonError("Faltan campos obligatorios", 400);
  }

  let finalQualifyingTeam = qualifyingTeam || null;
  const jornadaNum = parseInt(jornada, 10);
  if (jornadaNum >= 4 && homeGoals !== undefined && homeGoals !== null && awayGoals !== undefined && awayGoals !== null) {
    const hg = parseInt(homeGoals, 10);
    const ag = parseInt(awayGoals, 10);
    if (hg > ag) {
      finalQualifyingTeam = homeTeam;
    } else if (hg < ag) {
      finalQualifyingTeam = awayTeam;
    }
  }

  try {
    const match = await db.match.create({
      data: {
        homeTeam,
        awayTeam,
        homeTeamCrest: homeTeamCrest || null,
        awayTeamCrest: awayTeamCrest || null,
        date: parseMadridTimeToUTC(date),
        phase,
        groupStageNumber: groupStageNumber ? parseInt(groupStageNumber, 10) : null,
        jornada: jornadaNum,
        status: status || "SCHEDULED",
        homeGoals: homeGoals !== undefined && homeGoals !== null ? parseInt(homeGoals, 10) : null,
        awayGoals: awayGoals !== undefined && awayGoals !== null ? parseInt(awayGoals, 10) : null,
        qualifyingTeam: finalQualifyingTeam,
      },
    });

    return NextResponse.json({ match, message: "Partido creado correctamente" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al crear el partido";
    return jsonError(message, 500);
  }
}
