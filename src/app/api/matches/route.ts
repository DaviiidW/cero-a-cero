import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  const matches = await db.match.findMany({
    orderBy: { date: "asc" },
    select: {
      id: true,
      homeTeam: true,
      awayTeam: true,
      homeTeamCrest: true,
      awayTeamCrest: true,
      date: true,
      phase: true,
      groupStageNumber: true,
      jornada: true,
      status: true,
      homeGoals: true,
      awayGoals: true,
    },
  });

  return NextResponse.json({
    matches,
    updatedAt: new Date().toISOString(),
  });
}
