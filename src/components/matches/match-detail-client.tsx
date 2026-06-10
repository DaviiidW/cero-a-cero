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
    homeTeamCrest?: string | null;
    awayTeamCrest?: string | null;
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
      <div className="space-y-4 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {match.phase} {match.groupStageNumber ? `· Jornada ${match.groupStageNumber}` : ""}
        </p>
        
        <div className="flex items-center justify-center gap-4 py-2">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-2 flex-1 text-center">
            {match.homeTeamCrest ? (
              <img
                src={match.homeTeamCrest}
                alt={`Escudo de ${match.homeTeam}`}
                className="h-12 w-18 md:h-16 md:w-24 object-contain rounded-lg border border-muted/80 shadow-sm"
              />
            ) : (
              <div className="h-12 w-18 md:h-16 md:w-24 rounded-lg border border-dashed border-muted flex items-center justify-center text-xs text-muted-foreground bg-muted/20">
                ?
              </div>
            )}
            <span className="text-base font-bold tracking-tight md:text-lg">{match.homeTeam}</span>
          </div>

          {/* VS Divider */}
          <div className="text-xs text-muted-foreground font-semibold px-2.5 py-1 bg-muted rounded-md select-none shrink-0">
            VS
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-2 flex-1 text-center">
            {match.awayTeamCrest ? (
              <img
                src={match.awayTeamCrest}
                alt={`Escudo de ${match.awayTeam}`}
                className="h-12 w-18 md:h-16 md:w-24 object-contain rounded-lg border border-muted/80 shadow-sm"
              />
            ) : (
              <div className="h-12 w-18 md:h-16 md:w-24 rounded-lg border border-dashed border-muted flex items-center justify-center text-xs text-muted-foreground bg-muted/20">
                ?
              </div>
            )}
            <span className="text-base font-bold tracking-tight md:text-lg">{match.awayTeam}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {new Date(match.date).toLocaleString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
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
