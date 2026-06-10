"use client";

import { useState, useEffect } from "react";
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
  groupPredictions?: {
    userId: string;
    nick: string;
    predictionHomeGoals: number;
    predictionAwayGoals: number;
    resultType: ResultTypeLabel;
    pointsEarned: number | null;
  }[];
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

  const [homeGoals, setHomeGoals] = useState<string>("");
  const [awayGoals, setAwayGoals] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Sync state with prediction when it loads/changes
  useEffect(() => {
    if (data?.prediction) {
      setHomeGoals(data.prediction.predictionHomeGoals.toString());
      setAwayGoals(data.prediction.predictionAwayGoals.toString());
    }
  }, [data?.prediction]);

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

  // Bloqueo de 3 minutos antes del partido
  const matchDate = new Date(match.date);
  const now = new Date();
  const isLocked = match.status !== "SCHEDULED" || (matchDate.getTime() - now.getTime() < 3 * 60 * 1000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const parsedHome = parseInt(homeGoals, 10);
    const parsedAway = parseInt(awayGoals, 10);

    if (isNaN(parsedHome) || isNaN(parsedAway) || parsedHome < 0 || parsedAway < 0) {
      setFormError("Los goles deben ser números enteros mayores o iguales a 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/matches/${matchId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          predictionHomeGoals: parsedHome,
          predictionAwayGoals: parsedAway,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Error al guardar la predicción.");
      }

      setFormSuccess("¡Predicción guardada correctamente!");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error al guardar la predicción.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del Partido con Banderas */}
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

        {/* Resultado Real */}
        <div className="rounded-xl bg-muted/40 p-4 text-center">
          <p className="text-sm text-muted-foreground">Resultado Real (90 min)</p>
          <p className="text-3xl font-bold">
            {formatScore(match.homeGoals, match.awayGoals)}
          </p>
        </div>

        {/* Sección de Mi Predicción */}
        <div className="rounded-xl border border-border p-4 bg-muted/20">
          <h3 className="font-semibold text-base mb-3">Tu predicción</h3>
          {isLocked ? (
            prediction ? (
              <div className="space-y-2">
                <p className="text-lg font-bold">
                  {prediction.predictionHomeGoals} - {prediction.predictionAwayGoals}{" "}
                  <span className="text-xs font-normal text-muted-foreground px-2 py-0.5 bg-muted rounded-full ml-2">
                    {formatResultType(prediction.resultType)}
                  </span>
                </p>
                {isFinished ? (
                  <p className="text-sm">
                    Puntos obtenidos:{" "}
                    <strong className="text-emerald-500 font-bold">
                      {prediction.pointsEarned !== null
                        ? `+${prediction.pointsEarned}`
                        : "Pendiente de calcular"}
                    </strong>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse" />
                    Las predicciones están cerradas. Los puntos se calcularán al finalizar el partido.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No enviaste predicción para este partido y el plazo de envío ya ha finalizado.
              </p>
            )
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <span className="text-sm font-medium hidden md:inline">{match.homeTeam}</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={homeGoals}
                    onChange={(e) => setHomeGoals(e.target.value)}
                    className="w-16 h-10 text-center font-bold text-lg rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={isSubmitting}
                    placeholder="-"
                    required
                  />
                </div>
                <span className="text-muted-foreground font-semibold">—</span>
                <div className="flex items-center gap-3 flex-1 justify-start">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={awayGoals}
                    onChange={(e) => setAwayGoals(e.target.value)}
                    className="w-16 h-10 text-center font-bold text-lg rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={isSubmitting}
                    placeholder="-"
                    required
                  />
                  <span className="text-sm font-medium hidden md:inline">{match.awayTeam}</span>
                </div>
              </div>

              {formError && (
                <p className="text-xs text-destructive text-center font-medium bg-destructive/10 py-1.5 px-3 rounded-md">
                  {formError}
                </p>
              )}
              {formSuccess && (
                <p className="text-xs text-emerald-500 text-center font-medium bg-emerald-500/10 py-1.5 px-3 rounded-md">
                  {formSuccess}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg text-sm hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : prediction ? "Actualizar predicción" : "Guardar predicción"}
                </button>
              </div>
              
              <p className="text-[11px] text-muted-foreground text-center">
                Puedes crear o editar tu predicción hasta 3 minutos antes de que inicie el partido.
              </p>
            </form>
          )}
        </div>
      </div>

      {/* HU-05 y HU-07: Predicciones de los otros usuarios del grupo */}
      {(match.status === "LIVE" || match.status === "FINISHED") && data.groupPredictions && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-base tracking-tight">Predicciones de los miembros del grupo</h3>
          {data.groupPredictions.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Nadie en el grupo ha realizado predicciones para este partido.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-muted-foreground text-xs uppercase font-medium select-none">
                  <tr>
                    <th className="px-4 py-3">Miembro</th>
                    <th className="px-4 py-3 text-center">Predicción</th>
                    {match.status === "FINISHED" && <th className="px-4 py-3 text-right">Puntos</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.groupPredictions.map((pred) => (
                    <tr key={pred.userId} className="hover:bg-muted/40 transition">
                      <td className="px-4 py-3 font-medium">
                        {pred.nick}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {pred.predictionHomeGoals} - {pred.predictionAwayGoals}
                      </td>
                      {match.status === "FINISHED" && (
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                            pred.pointsEarned && pred.pointsEarned > 0
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            +{pred.pointsEarned ?? 0} pts
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

