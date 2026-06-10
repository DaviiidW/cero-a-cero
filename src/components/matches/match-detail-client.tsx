"use client";

import { useState, useEffect } from "react";
import { usePolling } from "@/hooks/use-polling";
import { formatResultType, formatScore } from "@/lib/scoring/labels";
import type { ResultTypeLabel } from "@/lib/scoring/labels";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Calendar, Trophy, Users } from "lucide-react";

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
      <Card className="max-w-3xl mx-auto border-border/60 animate-pulse bg-card/60">
        <CardContent className="h-64 flex items-center justify-center text-sm text-muted-foreground">
          Cargando partido...
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="max-w-3xl mx-auto border-destructive/20 bg-destructive/5 text-destructive">
        <CardContent className="p-6 text-center text-sm font-semibold">
          {error ?? "Error al cargar la información del partido"}
        </CardContent>
      </Card>
    );
  }

  const { match, prediction } = data;
  const isFinished = match.status === "FINISHED";

  // Lockout at 3 minutes before match date
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
      
      {/* Cabecera del Partido con Banderas (HU-05) */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4 text-center">
            <Badge variant="gold" className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 select-none">
              {match.phase} {match.groupStageNumber ? `· Jornada ${match.groupStageNumber}` : ""}
            </Badge>
            
            <div className="flex items-center justify-center gap-4 py-2 select-none">
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
                <span className="text-base font-extrabold tracking-tight md:text-lg text-foreground">{match.homeTeam}</span>
              </div>

              {/* VS Divider */}
              <div className="text-xs text-muted-foreground font-black px-3 py-1.5 bg-muted rounded-xl select-none shrink-0">
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
                <span className="text-base font-extrabold tracking-tight md:text-lg text-foreground">{match.awayTeam}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1">
              <Calendar className="size-3.5 text-primary" />
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
          <div className="rounded-2xl bg-muted/30 border border-border/40 p-4 text-center select-none space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Resultado Real (90 min)</p>
            <p className="text-3xl font-black tracking-tight text-foreground">
              {formatScore(match.homeGoals, match.awayGoals)}
            </p>
          </div>

          {/* Sección de Mi Predicción (HU-07) */}
          <div className="rounded-2xl border border-border/60 p-5 bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 select-none">
                <Trophy className="size-4 text-accent" />
                Tu Predicción
              </h3>
              {isLocked ? (
                <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-wider flex items-center gap-1 select-none text-muted-foreground">
                  <Lock className="size-2.5" />
                  Cerrado
                </Badge>
              ) : (
                <Badge variant="emerald" className="text-[9px] uppercase font-black tracking-wider flex items-center gap-1 select-none">
                  <Unlock className="size-2.5" />
                  Abierto
                </Badge>
              )}
            </div>

            {isLocked ? (
              prediction ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-foreground">
                      {prediction.predictionHomeGoals} - {prediction.predictionAwayGoals}
                    </span>
                    <Badge variant="gold" className="text-[9px] font-bold uppercase tracking-wider py-0 px-1 border-accent/20">
                      {formatResultType(prediction.resultType)}
                    </Badge>
                  </div>
                  {isFinished ? (
                    <p className="text-xs text-muted-foreground">
                      Puntos obtenidos:{" "}
                      <span className="text-primary font-black text-sm ml-1">
                        {prediction.pointsEarned !== null
                          ? `+${prediction.pointsEarned} pts`
                          : "Pendiente"}
                      </span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-medium">
                      <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse" />
                      Las predicciones están bloqueadas. Los puntos se calcularán al finalizar el partido.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  No enviaste predicción para este partido y el plazo de envío ya ha finalizado.
                </p>
              )
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <span className="text-xs font-bold hidden md:inline text-foreground">{match.homeTeam}</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={homeGoals}
                      onChange={(e) => setHomeGoals(e.target.value)}
                      className="w-16 h-10 text-center font-bold text-lg rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary shadow-inner text-foreground"
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
                      className="w-16 h-10 text-center font-bold text-lg rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary shadow-inner text-foreground"
                      disabled={isSubmitting}
                      placeholder="-"
                      required
                    />
                    <span className="text-xs font-bold hidden md:inline text-foreground">{match.awayTeam}</span>
                  </div>
                </div>

                {formError && (
                  <p className="text-xs text-destructive text-center font-medium bg-destructive/10 py-1.5 px-3 rounded-xl border border-destructive/20">
                    {formError}
                  </p>
                )}
                {formSuccess && (
                  <p className="text-xs text-emerald-500 text-center font-medium bg-emerald-500/10 py-1.5 px-3 rounded-xl border border-emerald-500/20">
                    {formSuccess}
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/90 transition shadow-sm w-full sm:w-auto"
                  >
                    {isSubmitting ? "Guardando..." : prediction ? "Actualizar predicción" : "Guardar predicción"}
                  </Button>
                </div>
                
                <p className="text-[10px] text-muted-foreground text-center italic select-none">
                  Puedes registrar o modificar tu predicción hasta 3 minutos antes de que empiece el partido.
                </p>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* HU-05 y HU-07: Predicciones de los otros usuarios del grupo (Table de shadcn) */}
      {(match.status === "LIVE" || match.status === "FINISHED") && data.groupPredictions && (
        <Card className="border-border shadow-sm">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2 select-none">
              <Users className="size-4 text-primary" />
              Predicciones del Grupo
            </CardTitle>
            <CardDescription className="text-xs">Pronósticos realizados por los miembros de tu grupo</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {data.groupPredictions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">
                Nadie en el grupo ha realizado predicciones para este partido.
              </p>
            ) : (
              <div className="rounded-2xl border border-border overflow-hidden bg-card mt-2">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border select-none">
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Miembro</TableHead>
                      <TableHead className="text-center font-bold text-xs uppercase tracking-wider text-muted-foreground">Predicción</TableHead>
                      {match.status === "FINISHED" && <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground">Puntos</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.groupPredictions.map((pred) => (
                      <TableRow key={pred.userId} className="hover:bg-muted/10 border-b border-border/60 transition">
                        <TableCell className="font-semibold text-foreground py-3.5">
                          {pred.nick}
                        </TableCell>
                        <TableCell className="text-center font-extrabold text-foreground">
                          {pred.predictionHomeGoals} - {pred.predictionAwayGoals}
                        </TableCell>
                        {match.status === "FINISHED" && (
                          <TableCell className="text-right py-3">
                            <Badge variant={pred.pointsEarned && pred.pointsEarned > 0 ? "emerald" : "secondary"} className="text-[10px] font-bold py-0.5 px-2 select-none">
                              +{pred.pointsEarned ?? 0} pts
                            </Badge>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
