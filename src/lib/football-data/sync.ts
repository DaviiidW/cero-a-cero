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

function getNinetyMinuteScore(match: FootballDataMatch) {
  if (match.status !== "FINISHED") {
    return { homeGoals: null, awayGoals: null };
  }

  const fullTime = match.score.fullTime;
  return {
    homeGoals: fullTime.home ?? fullTime.homeTeam ?? null,
    awayGoals: fullTime.away ?? fullTime.awayTeam ?? null,
  };
}

export async function syncMatchesFromFootballData() {
  const { matches } = await fetchWorldCupMatches();
  let upserted = 0;
  const finishedMatchIds: string[] = [];

  for (const apiMatch of matches) {
    const { homeGoals, awayGoals } = getNinetyMinuteScore(apiMatch);
    const status = mapStatus(apiMatch.status);
    const data = {
      homeTeam: apiMatch.homeTeam?.name ? translateTeamName(apiMatch.homeTeam.name) : "Por definir",
      awayTeam: apiMatch.awayTeam?.name ? translateTeamName(apiMatch.awayTeam.name) : "Por definir",
      homeTeamCrest: apiMatch.homeTeam?.crest || null,
      awayTeamCrest: apiMatch.awayTeam?.crest || null,
      date: new Date(apiMatch.utcDate),
      phase: mapPhase(apiMatch.stage),
      groupStageNumber:
        apiMatch.stage === "GROUP_STAGE" ? apiMatch.matchday : null,
      status,
      homeGoals,
      awayGoals,
    };

    const existing = await db.match.findUnique({
      where: { externalId: apiMatch.id },
      select: { id: true, status: true },
    });

    if (existing) {
      await db.match.update({
        where: { id: existing.id },
        data,
      });

      if (status === MatchStatus.FINISHED) {
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
