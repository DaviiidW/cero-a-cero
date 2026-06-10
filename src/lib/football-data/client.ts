import type { FootballDataMatchesResponse } from "@/lib/football-data/types";

const API_BASE = "https://api.football-data.org/v4";

export function getFootballDataToken(): string {
  const token = process.env.FOOTBALL_DATA_API_TOKEN;
  if (!token) {
    throw new Error("FOOTBALL_DATA_API_TOKEN no está configurada");
  }
  return token;
}

export async function fetchWorldCupMatches(season?: string) {
  const token = getFootballDataToken();
  const competitionSeason =
    season ?? process.env.FOOTBALL_DATA_SEASON ?? "2026";
  const url = `${API_BASE}/competitions/WC/matches?season=${competitionSeason}`;

  const response = await fetch(url, {
    headers: {
      "X-Auth-Token": token,
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(
      `football-data.org respondió con ${response.status}: ${response.statusText}`
    );
  }

  return (await response.json()) as FootballDataMatchesResponse;
}
