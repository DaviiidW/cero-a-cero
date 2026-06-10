import { ResultType } from "@/generated/prisma/client";

export function getResultTypeFromScore(
  homeGoals: number,
  awayGoals: number
): ResultType {
  if (homeGoals > awayGoals) {
    return ResultType.HOME;
  }

  if (homeGoals < awayGoals) {
    return ResultType.AWAY;
  }

  return ResultType.DRAW;
}
