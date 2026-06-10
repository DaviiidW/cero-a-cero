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
  homeTeam: { name: string };
  awayTeam: { name: string };
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
