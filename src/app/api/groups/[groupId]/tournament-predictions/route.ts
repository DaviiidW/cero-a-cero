import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { GROUP_ERRORS } from "@/lib/groups/errors";
import { isGroupMember } from "@/lib/groups/service";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  const { groupId } = await context.params;
  const member = await isGroupMember(user.id, groupId);

  if (!member) {
    return jsonError(GROUP_ERRORS.NOT_MEMBER, 403);
  }

  // Check if tournament has started
  const firstMatch = await db.match.findFirst({
    orderBy: { date: "asc" },
  });
  const now = new Date();
  const activeOrFinishedMatch = await db.match.findFirst({
    where: {
      status: { in: ["LIVE", "FINISHED"] },
    },
  });
  const hasStarted = !!activeOrFinishedMatch || (firstMatch ? now >= new Date(firstMatch.date) : false);

  // Retrieve user's tournament prediction
  const prediction = await db.tournamentPrediction.findUnique({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
  });

  const realResult = await db.tournamentResult.findUnique({
    where: { id: "singleton" },
  });

  // Build list of all available teams from matches
  const matches = await db.match.findMany({
    select: { homeTeam: true, awayTeam: true },
  });
  const teamsSet = new Set<string>();
  for (const m of matches) {
    if (m.homeTeam && m.homeTeam !== "Por definir") teamsSet.add(m.homeTeam);
    if (m.awayTeam && m.awayTeam !== "Por definir") teamsSet.add(m.awayTeam);
  }
  const teams = Array.from(teamsSet).sort();

  // Fetch finished matches to compute team stats
  const finishedMatches = await db.match.findMany({
    where: {
      status: "FINISHED",
      homeGoals: { not: null },
      awayGoals: { not: null },
    },
  });

  const teamStats: Record<string, { scored: number; conceded: number; points: number }> = {};
  for (const m of finishedMatches) {
    const home = m.homeTeam;
    const away = m.awayTeam;
    const hg = m.homeGoals!;
    const ag = m.awayGoals!;

    if (!teamStats[home]) teamStats[home] = { scored: 0, conceded: 0, points: 0 };
    if (!teamStats[away]) teamStats[away] = { scored: 0, conceded: 0, points: 0 };

    teamStats[home].scored += hg;
    teamStats[home].conceded += ag;
    teamStats[away].scored += ag;
    teamStats[away].conceded += hg;
  }

  for (const team in teamStats) {
    teamStats[team].points = Math.floor(teamStats[team].conceded / 3) - teamStats[team].scored;
  }

  // If started, retrieve all other members' predictions
  let groupPredictions: {
    userId: string;
    nick: string;
    champion: string | null;
    runnerUp: string | null;
    thirdPlace: string | null;
    worstTeam: string | null;
  }[] = [];
  if (hasStarted) {
    const allPredictions = await db.tournamentPrediction.findMany({
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

    groupPredictions = allPredictions.map((pred) => ({
      userId: pred.userId,
      nick: pred.user.memberships[0]?.nick || pred.user.nickGlobal,
      champion: pred.champion,
      runnerUp: pred.runnerUp,
      thirdPlace: pred.thirdPlace,
      worstTeam: pred.worstTeam,
    }));
  }

  return NextResponse.json({
    prediction,
    teams,
    hasStarted,
    groupPredictions,
    realResult,
    teamStats,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  const { groupId } = await context.params;
  const member = await isGroupMember(user.id, groupId);

  if (!member) {
    return jsonError(GROUP_ERRORS.NOT_MEMBER, 403);
  }

  // Check if tournament has started
  const firstMatch = await db.match.findFirst({
    orderBy: { date: "asc" },
  });
  const now = new Date();
  const activeOrFinishedMatch = await db.match.findFirst({
    where: {
      status: { in: ["LIVE", "FINISHED"] },
    },
  });
  const hasStarted = !!activeOrFinishedMatch || (firstMatch ? now >= new Date(firstMatch.date) : false);

  if (hasStarted) {
    return jsonError("El torneo ya ha comenzado. Las predicciones especiales están bloqueadas.", 400);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo de solicitud inválido", 400);
  }

  const { champion, runnerUp, thirdPlace, worstTeam } = body;

  const prediction = await db.tournamentPrediction.upsert({
    where: {
      userId_groupId: {
        userId: user.id,
        groupId,
      },
    },
    create: {
      userId: user.id,
      groupId,
      champion: champion || null,
      runnerUp: runnerUp || null,
      thirdPlace: thirdPlace || null,
      worstTeam: worstTeam || null,
    },
    update: {
      champion: champion || null,
      runnerUp: runnerUp || null,
      thirdPlace: thirdPlace || null,
      worstTeam: worstTeam || null,
    },
  });

  return NextResponse.json({
    prediction,
    message: "Predicciones especiales guardadas correctamente",
  });
}
