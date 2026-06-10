"use client";

import { usePolling } from "@/hooks/use-polling";
import { formatResultType, formatScore } from "@/lib/scoring/labels";
import type { ResultTypeLabel } from "@/lib/scoring/labels";

type MatchDetailClientProps = {
  groupId: string;
  matchId: string;
};

type MatchDetailResponse = {
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    date: string;
    phase: string;
    groupStageNumber: number | null;
    status: string;
    homeGoals: number | null;
    awayGoals: number | null;
  };
  prediction: {
    predictionHomeGoals: number;
    predictionAwayGoals: number;
    resultType: ResultTypeLabel;
    pointsEarned: number | null;
  } | null;
};

export function MatchDetailClient({ groupId, matchId }: MatchDetailClientProps) {
  const { data, error, isLoading } = usePolling<MatchDetailResponse>(
    async () => {
      const response = await fetch(
        `/api/groups/${groupId}/matches/${matchId}`
      );
      if (!response.ok) {
        throw new Error("No se pudo cargar el partido");
      }
      return response.json();
    }
  );

  if (isLoading && !data) {
    return (
      <p className="text-sm text-muted-foreground">Cargando partido...</p>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-destructive">{error ?? "Error"}</p>;
  }

  const { match, prediction } = data;
  const isFinished = match.status === "FINISHED";

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
      <div className="space-y-1 text-center">
        <p className="text-sm text-muted-foreground">{match.phase}</p>
        <h2 className="text-2xl font-semibold">
          {match.homeTeam} vs {match.awayTeam}
        </h2>
        <p className="text-sm text-muted-foreground">
          {new Date(match.date).toLocaleString("es-ES")}
        </p>
      </div>

      <div className="rounded-xl bg-muted/40 p-4 text-center">
        <p className="text-sm text-muted-foreground">Resultado (90 min)</p>
        <p className="text-3xl font-bold">
          {formatScore(match.homeGoals, match.awayGoals)}
        </p>
      </div>

      {prediction ? (
        <div className="space-y-2 rounded-xl border border-border p-4">
          <h3 className="font-medium">Tu predicción</h3>
          <p>
            {formatScore(
              prediction.predictionHomeGoals,
              prediction.predictionAwayGoals
            )}{" "}
            ({formatResultType(prediction.resultType)})
          </p>
          {isFinished ? (
            <p className="text-sm">
              Puntos obtenidos:{" "}
              <strong>
                {prediction.pointsEarned !== null
                  ? `+${prediction.pointsEarned}`
                  : "Pendiente de calcular"}
              </strong>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Los puntos se calcularán al finalizar el partido.
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No tienes predicción para este partido en este grupo.
        </p>
      )}
    </div>
  );
}
