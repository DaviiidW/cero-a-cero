import fs from "fs";
import path from "path";
import { MatchStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { fetchWorldCupMatches } from "@/lib/football-data/client";
import type { FootballDataMatch } from "@/lib/football-data/types";
import { processFinishedMatchScoring } from "@/lib/scoring/process-match";

const PHASE_LABELS: Record<string, string> = {
  GROUP_STAGE: "Fase de grupos",
  LAST_16: "Octavos de final",
  QUARTER_FINALS: "Cuartos de final",
  SEMI_FINALS: "Semifinales",
  THIRD_PLACE: "Tercer puesto",
  FINAL: "Final",
  LAST_32: "Dieciseisavos de final",
};

const TEAM_TRANSLATIONS: Record<string, string> = {
  "Algeria": "Argelia",
  "Argentina": "Argentina",
  "Australia": "Australia",
  "Austria": "Austria",
  "Belgium": "Bélgica",
  "Bosnia-Herzegovina": "Bosnia y Herzegovina",
  "Brazil": "Brasil",
  "Canada": "Canadá",
  "Cape Verde Islands": "Cabo Verde",
  "Colombia": "Colombia",
  "Congo DR": "República Democrática del Congo",
  "Croatia": "Croacia",
  "Curaçao": "Curazao",
  "Czechia": "República Checa",
  "Ecuador": "Ecuador",
  "Egypt": "Egipto",
  "England": "Inglaterra",
  "France": "Francia",
  "Germany": "Alemania",
  "Ghana": "Ghana",
  "Haiti": "Haití",
  "Iran": "Irán",
  "Iraq": "Irak",
  "Ivory Coast": "Costa de Marfil",
  "Japan": "Japón",
  "Jordan": "Jordania",
  "Mexico": "México",
  "Morocco": "Marruecos",
  "Netherlands": "Países Bajos",
  "New Zealand": "Nueva Zelanda",
  "Norway": "Noruega",
  "Panama": "Panamá",
  "Paraguay": "Paraguay",
  "Portugal": "Portugal",
  "Qatar": "Catar",
  "Saudi Arabia": "Arabia Saudita",
  "Scotland": "Escocia",
  "Senegal": "Senegal",
  "South Africa": "Sudáfrica",
  "South Korea": "Corea del Sur",
  "Spain": "España",
  "Sweden": "Suecia",
  "Switzerland": "Suiza",
  "Tunisia": "Túnez",
  "Turkey": "Turquía",
  "United States": "Estados Unidos",
  "Uruguay": "Uruguay",
  "Uzbekistan": "Uzbekistán",
};

function translateTeamName(name: string): string {
  return TEAM_TRANSLATIONS[name] ?? name;
}

function mapStatus(status: FootballDataMatch["status"]): MatchStatus {
  switch (status) {
    case "LIVE":
    case "IN_PLAY":
    case "PAUSED":
      return MatchStatus.LIVE;
    case "FINISHED":
      return MatchStatus.FINISHED;
    default:
      return MatchStatus.SCHEDULED;
  }
}

function mapPhase(stage: string): string {
  return PHASE_LABELS[stage] ?? stage;
}

function mapJornada(stage: string, matchday: number | null): number {
  if (stage === "GROUP_STAGE") {
    return matchday || 1;
  } else if (stage === "LAST_32") {
    return 4;
  } else if (stage === "LAST_16") {
    return 5;
  } else if (stage === "QUARTER_FINALS") {
    return 6;
  } else if (stage === "SEMI_FINALS") {
    return 7;
  } else if (stage === "THIRD_PLACE" || stage === "FINAL") {
    return 8;
  }
  return 1;
}

async function fetchFallbackScores(): Promise<Map<number, { homeGoals: number; awayGoals: number }>> {
  const scoresMap = new Map<number, { homeGoals: number; awayGoals: number }>();
  try {
    const res = await fetch("https://native-stats.org/competition/WC/", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      next: { revalidate: 0 }
    } as RequestInit & { next?: { revalidate: number } });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const html = await res.text();
    const matchBlocks = html.split(/\/match\/(\d+)/g);
    for (let i = 1; i < matchBlocks.length; i += 2) {
      const id = parseInt(matchBlocks[i], 10);
      const segment = matchBlocks[i + 1] || "";
      const scoreMatch = segment.substring(0, 500).match(/>\s*(\d+)\s*:\s*(\d+)\s*</);
      if (scoreMatch) {
        scoresMap.set(id, {
          homeGoals: parseInt(scoreMatch[1], 10),
          awayGoals: parseInt(scoreMatch[2], 10),
        });
      }
    }
  } catch (error) {
    console.error("[Fallback Sync] Error fetching fallback scores from native-stats:", error);
  }
  return scoresMap;
}

function getNinetyMinuteScore(match: FootballDataMatch, fallbackScores?: Map<number, { homeGoals: number; awayGoals: number }>) {
  const isLiveOrFinished = ["LIVE", "IN_PLAY", "PAUSED", "FINISHED"].includes(match.status);
  if (!isLiveOrFinished) {
    return { homeGoals: null, awayGoals: null };
  }

  const fullTime = match.score.fullTime;
  let homeGoals = fullTime.home ?? fullTime.homeTeam ?? null;
  let awayGoals = fullTime.away ?? fullTime.awayTeam ?? null;

  if (homeGoals === null && awayGoals === null && fallbackScores) {
    const fallback = fallbackScores.get(match.id);
    if (fallback !== undefined) {
      homeGoals = fallback.homeGoals;
      awayGoals = fallback.awayGoals;
    }
  }

  return { homeGoals, awayGoals };
}

async function downloadFlagLocally(teamName: string, remoteUrl: string | null | undefined): Promise<string | null> {
  if (!remoteUrl || remoteUrl.includes("placeholder")) return null;

  // Clean team name for safe filename
  const safeName = teamName.toLowerCase().replace(/[^a-z0-9]/g, "-");

  // Detect extension
  let ext = ".svg";
  if (remoteUrl.endsWith(".png")) ext = ".png";
  else if (remoteUrl.endsWith(".jpg") || remoteUrl.endsWith(".jpeg")) ext = ".jpg";

  const filename = `${safeName}${ext}`;
  const localDir = path.join(process.cwd(), "public", "flags");
  const localPath = path.join(localDir, filename);

  if (fs.existsSync(localPath)) {
    return `/flags/${filename}`;
  }

  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }

  try {
    const res = await fetch(remoteUrl);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(localPath, Buffer.from(buffer));
    return `/flags/${filename}`;
  } catch (error) {
    console.error(`Error downloading flag for ${teamName}:`, error);
    return remoteUrl; // fallback to remote URL if download fails
  }
}

export async function syncMatchesFromFootballData() {
  const { matches } = await fetchWorldCupMatches();
  const fallbackScores = await fetchFallbackScores();
  let upserted = 0;
  const finishedMatchIds: string[] = [];

  for (const apiMatch of matches) {
    const { homeGoals, awayGoals } = getNinetyMinuteScore(apiMatch, fallbackScores);
    const status = mapStatus(apiMatch.status);

    const homeTeamName = apiMatch.homeTeam?.name ? translateTeamName(apiMatch.homeTeam.name) : "Por definir";
    const awayTeamName = apiMatch.awayTeam?.name ? translateTeamName(apiMatch.awayTeam.name) : "Por definir";

    // Download crests locally
    const homeCrestLocal = await downloadFlagLocally(homeTeamName, apiMatch.homeTeam?.crest);
    const awayCrestLocal = await downloadFlagLocally(awayTeamName, apiMatch.awayTeam?.crest);

    const data = {
      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      homeTeamCrest: homeCrestLocal,
      awayTeamCrest: awayCrestLocal,
      date: new Date(apiMatch.utcDate),
      phase: mapPhase(apiMatch.stage),
      groupStageNumber:
        apiMatch.stage === "GROUP_STAGE" ? apiMatch.matchday : null,
      jornada: mapJornada(apiMatch.stage, apiMatch.matchday),
      status,
      homeGoals,
      awayGoals,
    };

    const existing = await db.match.findUnique({
      where: { externalId: apiMatch.id },
      select: { id: true, status: true, homeGoals: true, awayGoals: true },
    });

    if (existing) {
      let finalStatus = status;
      let finalHomeGoals = homeGoals;
      let finalAwayGoals = awayGoals;

      if (status === MatchStatus.SCHEDULED) {
        if (existing.status === MatchStatus.LIVE || existing.status === MatchStatus.FINISHED) {
          finalStatus = existing.status;
        }
        if (existing.homeGoals !== null || existing.awayGoals !== null) {
          finalHomeGoals = existing.homeGoals;
          finalAwayGoals = existing.awayGoals;
        }
      }

      await db.match.update({
        where: { id: existing.id },
        data: {
          ...data,
          status: finalStatus,
          homeGoals: finalHomeGoals,
          awayGoals: finalAwayGoals,
        },
      });

      // Only score on transition to FINISHED or when goals are updated from null to a number
      const becameFinished = finalStatus === MatchStatus.FINISHED && existing.status !== MatchStatus.FINISHED;
      const goalsPopulated = finalStatus === MatchStatus.FINISHED &&
                             (existing.homeGoals === null || existing.awayGoals === null) &&
                             (finalHomeGoals !== null && finalAwayGoals !== null);

      if (becameFinished || goalsPopulated) {
        finishedMatchIds.push(existing.id);
      }
    } else {
      const created = await db.match.create({
        data: {
          externalId: apiMatch.id,
          ...data,
        },
        select: { id: true },
      });

      if (status === MatchStatus.FINISHED) {
        finishedMatchIds.push(created.id);
      }
    }

    upserted += 1;
  }

  let predictionsProcessed = 0;

  for (const matchId of finishedMatchIds) {
    const result = await processFinishedMatchScoring(matchId);
    predictionsProcessed += result.processed;
  }

  return {
    matchesSynced: upserted,
    finishedMatchesScored: finishedMatchIds.length,
    predictionsProcessed,
  };
}

/**
 * Sincroniza SOLO los partidos que están activos en este momento.
 * Es mucho más eficiente que syncMatchesFromFootballData porque:
 * 1. Filtra desde la API los partidos en estado activo antes de procesar.
 * 2. Solo hace upsert de los partidos relevantes (no todos los del torneo).
 * 3. Detecta transiciones LIVE→FINISHED para disparar scoring exactamente una vez.
 */
export async function syncLiveMatchesOnly(): Promise<{
  activeMatchesFound: number;
  matchesSynced: number;
  finishedMatchesScored: number;
  predictionsProcessed: number;
}> {
  const now = new Date();

  // Step 1: Check our DB for matches that should be active right now
  // Includes finished matches with missing/null goals OR unscored predictions (recovery)
  const activeInDb = await db.match.findMany({
    where: {
      OR: [
        { status: MatchStatus.LIVE },
        {
          status: MatchStatus.SCHEDULED,
          date: { lte: now },
        },
        {
          status: MatchStatus.FINISHED,
          OR: [
            { homeGoals: null },
            { awayGoals: null },
          ],
        },
        // Recovery: FINISHED matches with goals but still have unscored predictions
        {
          status: MatchStatus.FINISHED,
          homeGoals: { not: null },
          awayGoals: { not: null },
          predictions: {
            some: { scoredAt: null },
          },
        },
      ],
    },
    select: { id: true, externalId: true, status: true, homeGoals: true, awayGoals: true },
  });

  if (activeInDb.length === 0) {
    return { activeMatchesFound: 0, matchesSynced: 0, finishedMatchesScored: 0, predictionsProcessed: 0 };
  }

  console.log(`[Live Sync] ${activeInDb.length} partidos activos en BD. Consultando API...`);

  // Step 2: Fetch all matches from API and filter to only active ones
  const { matches: allApiMatches } = await fetchWorldCupMatches();
  const fallbackScores = await fetchFallbackScores();
  const activeExternalIds = new Set(activeInDb.map((m) => m.externalId).filter(Boolean));

  // Include matches from API that are currently active OR match our active DB records
  const relevantApiMatches = allApiMatches.filter((m) => {
    const isActiveStatus = ["LIVE", "IN_PLAY", "PAUSED", "FINISHED"].includes(m.status);
    const isInOurActiveSet = activeExternalIds.has(m.id);
    return isActiveStatus || isInOurActiveSet;
  });

  let upserted = 0;
  const finishedMatchIds: string[] = [];
  const activeDbMap = new Map(activeInDb.map((m) => [m.externalId, m]));

  for (const apiMatch of relevantApiMatches) {
    const { homeGoals, awayGoals } = getNinetyMinuteScore(apiMatch, fallbackScores);
    const status = mapStatus(apiMatch.status);

    const homeTeamName = apiMatch.homeTeam?.name ? translateTeamName(apiMatch.homeTeam.name) : "Por definir";
    const awayTeamName = apiMatch.awayTeam?.name ? translateTeamName(apiMatch.awayTeam.name) : "Por definir";

    // For live sync we skip flag downloads (flags don't change mid-game)
    const existing = activeDbMap.get(apiMatch.id) ??
      await db.match.findUnique({
        where: { externalId: apiMatch.id },
        select: { id: true, status: true, homeGoals: true, awayGoals: true },
      });

    if (!existing) continue;

    let finalStatus = status;
    let finalHomeGoals = homeGoals;
    let finalAwayGoals = awayGoals;

    if (status === MatchStatus.SCHEDULED) {
      if (existing.status === MatchStatus.LIVE || existing.status === MatchStatus.FINISHED) {
        finalStatus = existing.status;
      }
      if (existing.homeGoals !== null || existing.awayGoals !== null) {
        finalHomeGoals = existing.homeGoals;
        finalAwayGoals = existing.awayGoals;
      }
    }

    await db.match.update({
      where: { id: existing.id },
      data: {
        homeTeam: homeTeamName,
        awayTeam: awayTeamName,
        date: new Date(apiMatch.utcDate),
        status: finalStatus,
        homeGoals: finalHomeGoals,
        awayGoals: finalAwayGoals,
      },
    });

    // Trigger scoring on transition to FINISHED, when goals are updated from null,
    // OR when the match is already FINISHED with goals but has unscored predictions (recovery)
    const becameFinished = finalStatus === MatchStatus.FINISHED && existing.status !== MatchStatus.FINISHED;
    const goalsPopulated = finalStatus === MatchStatus.FINISHED &&
                           (existing.homeGoals === null || existing.awayGoals === null) &&
                           (finalHomeGoals !== null && finalAwayGoals !== null);
    // Recovery: already FINISHED with goals but the match is in our activeInDb (has unscored predictions)
    const hasUnscoredPredictions = finalStatus === MatchStatus.FINISHED &&
                                   finalHomeGoals !== null && finalAwayGoals !== null &&
                                   activeDbMap.has(apiMatch.id);

    if (becameFinished || goalsPopulated || hasUnscoredPredictions) {
      if (!finishedMatchIds.includes(existing.id)) {
        finishedMatchIds.push(existing.id);
      }
      console.log(`[Live Sync] Partido ${existing.id}: disparando scoring (becameFinished=${becameFinished}, goalsPopulated=${goalsPopulated}, recovery=${hasUnscoredPredictions}).`);
    }

    upserted += 1;
  }

  let predictionsProcessed = 0;
  for (const matchId of finishedMatchIds) {
    const result = await processFinishedMatchScoring(matchId);
    predictionsProcessed += result.processed;
  }

  return {
    activeMatchesFound: activeInDb.length,
    matchesSynced: upserted,
    finishedMatchesScored: finishedMatchIds.length,
    predictionsProcessed,
  };
}

const globalForSync = globalThis as unknown as {
  syncIntervalId: NodeJS.Timeout | undefined;
};

/**
 * Scheduler de fallback para desarrollo local.
 * En producción, el cron de Vercel llama directamente a /api/cron/sync-live-matches.
 * Aquí se mantiene como backup para entornos sin cron externo.
 */
export function startLiveMatchesScheduler() {
  if (globalForSync.syncIntervalId) return;

  const runSync = async () => {
    try {
      const result = await syncLiveMatchesOnly();
      if (result.activeMatchesFound > 0) {
        console.log(`[Live Scheduler] Sync completado:`, result);
      }
    } catch (error) {
      console.error("[Live Scheduler] Error during background live sync:", error);
    }
  };

  // Run immediately on start, then repeat every 60 seconds
  runSync();
  globalForSync.syncIntervalId = setInterval(runSync, 60 * 1000);
}
