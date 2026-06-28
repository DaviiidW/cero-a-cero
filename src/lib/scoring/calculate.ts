import type { ResultType } from "@/generated/prisma/client";
import { getResultTypeFromScore } from "@/lib/scoring/result-type";

export type PredictionScoreInput = {
  predictionHomeGoals: number;
  predictionAwayGoals: number;
  resultType: ResultType;
  predictionQualify?: string | null;
};

export type MatchScoreInput = {
  homeGoals: number;
  awayGoals: number;
  jornada: number;
  qualifyingTeam?: string | null;
  homeTeam: string;
  awayTeam: string;
};

/**
 * Reglas de puntuación (backend):
 * Fase de Grupos (Jornadas 1-3):
 * - +4 por marcador exacto (90 minutos)
 * - +1 por signo 1X2
 * 
 * Fase Eliminatoria (Jornada 4 en adelante):
 * - +1 por acertar quien gana/empata en los 90 min (1X2)
 * - +3 adicionales por marcador exacto en 90 min (+3 pts)
 * - +1 adicional por acertar quien pasa de ronda (+1 pt)
 */
export function calculatePredictionPoints(
  prediction: PredictionScoreInput,
  actual: MatchScoreInput
): number {
  const actualResult = getResultTypeFromScore(actual.homeGoals, actual.awayGoals);

  // Jornada 4 en adelante (Eliminatorias)
  if (actual.jornada >= 4) {
    let points = 0;

    // 1. Acertar 1X2 en 90 minutos (+1 punto)
    const predictionResult = getResultTypeFromScore(
      prediction.predictionHomeGoals,
      prediction.predictionAwayGoals
    );
    if (predictionResult === actualResult) {
      points += 1;
    }

    // 2. Marcador exacto en 90 minutos (+3 puntos más)
    if (
      prediction.predictionHomeGoals === actual.homeGoals &&
      prediction.predictionAwayGoals === actual.awayGoals
    ) {
      points += 3;
    }

    // 3. Quién pasa de ronda (+1 punto más)
    let predQual = prediction.predictionQualify;
    if (!predQual) {
      if (prediction.predictionHomeGoals > prediction.predictionAwayGoals) {
        predQual = actual.homeTeam;
      } else if (prediction.predictionHomeGoals < prediction.predictionAwayGoals) {
        predQual = actual.awayTeam;
      }
    }

    let actualQual = actual.qualifyingTeam;
    if (!actualQual) {
      if (actual.homeGoals > actual.awayGoals) {
        actualQual = actual.homeTeam;
      } else if (actual.homeGoals < actual.awayGoals) {
        actualQual = actual.awayTeam;
      }
    }

    if (predQual && actualQual && predQual === actualQual) {
      points += 1;
    }

    return points;
  }

  // Reglas normales (Fase de Grupos)
  if (
    prediction.predictionHomeGoals === actual.homeGoals &&
    prediction.predictionAwayGoals === actual.awayGoals
  ) {
    return 4;
  }

  if (prediction.resultType === actualResult) {
    return 1;
  }

  return 0;
}
