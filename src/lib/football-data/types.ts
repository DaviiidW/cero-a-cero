export type FootballDataMatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "LIVE"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "POSTPONED"
  | "SUSPENDED"
  | "CANCELLED";

export type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: FootballDataMatchStatus;
  matchday: number | null;
  stage: string;
  homeTeam: { name: string; crest?: string | null };
  awayTeam: { name: string; crest?: string | null };
  score: {
    fullTime: {
      home?: number | null;
      away?: number | null;
      homeTeam?: number | null;
      awayTeam?: number | null;
    };
  };
};

export type FootballDataMatchesResponse = {
  matches: FootballDataMatch[];
};
