import fs from "fs";
import path from "path";
import { MatchStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { fetchWorldCupMatches } from "@/lib/football-data/client";

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

function isDefinedTeam(name: string | null | undefined): boolean {
  if (!name) return false;
  return (
    TEAM_TRANSLATIONS[name] !== undefined ||
    Object.values(TEAM_TRANSLATIONS).includes(name)
  );
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
  let upserted = 0;

  for (const apiMatch of matches) {
    const homeTeamRaw = apiMatch.homeTeam?.name;
    const awayTeamRaw = apiMatch.awayTeam?.name;

    // Check if both teams are defined (real national teams)
    if (!isDefinedTeam(homeTeamRaw) || !isDefinedTeam(awayTeamRaw)) {
      continue; // Skip undefined/placeholder matches
    }

    const homeTeamName = translateTeamName(homeTeamRaw);
    const awayTeamName = translateTeamName(awayTeamRaw);

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
    };

    const existing = await db.match.findUnique({
      where: { externalId: apiMatch.id },
      select: { id: true },
    });

    if (existing) {
      await db.match.update({
        where: { id: existing.id },
        data,
      });
    } else {
      await db.match.create({
        data: {
          externalId: apiMatch.id,
          ...data,
          status: MatchStatus.SCHEDULED,
          homeGoals: null,
          awayGoals: null,
          qualifyingTeam: null,
        },
      });
    }

    upserted += 1;
  }

  return {
    matchesSynced: upserted,
    finishedMatchesScored: 0,
    predictionsProcessed: 0,
  };
}


