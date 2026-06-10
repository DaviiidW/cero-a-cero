export type ResultTypeLabel = "HOME" | "DRAW" | "AWAY";

export function formatResultType(resultType: ResultTypeLabel): string {
  switch (resultType) {
    case "HOME":
      return "1";
    case "DRAW":
      return "X";
    case "AWAY":
      return "2";
  }
}

export function formatScore(home: number | null, away: number | null): string {
  if (home === null || away === null) {
    return "—";
  }
  return `${home} - ${away}`;
}
