import type { ResultType } from "@/generated/prisma/client";
import { getResultTypeFromScore } from "@/lib/scoring/result-type";

export type PredictionScoreInput = {
  predictionHomeGoals: number;
  predictionAwayGoals: number;
  resultType: ResultType;
};

export type MatchScoreInput = {
  homeGoals: number;
  awayGoals: number;
};

/**
 * Reglas únicas de puntuación (backend):
 * +1 por acertar el signo 1X2 respecto al local
 * +1 adicional por marcador exacto (90 minutos)
 */
export function calculatePredictionPoints(
  prediction: PredictionScoreInput,
  actual: MatchScoreInput
): number {
  const actualResult = getResultTypeFromScore(actual.homeGoals, actual.awayGoals);

  if (
    prediction.predictionHomeGoals === actual.homeGoals &&
    prediction.predictionAwayGoals === actual.awayGoals
  ) {
    return 3;
  }

  if (prediction.resultType === actualResult) {
    return 1;
  }

  return 0;
}
