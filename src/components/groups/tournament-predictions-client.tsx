"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, ShieldAlert, Award, Star, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type TeamStats = {
  scored: number;
  conceded: number;
  points: number;
};

type PredictionData = {
  champion: string | null;
  runnerUp: string | null;
  thirdPlace: string | null;
  worstTeam: string | null;
};

type RealResult = {
  champion: string | null;
  runnerUp: string | null;
  thirdPlace: string | null;
};

type GroupPredEntry = {
  userId: string;
  nick: string;
  champion: string | null;
  runnerUp: string | null;
  thirdPlace: string | null;
  worstTeam: string | null;
};

type TournamentPredictionsClientProps = {
  groupId: string;
  currentUserId: string;
};

export function TournamentPredictionsClient({ groupId, currentUserId }: TournamentPredictionsClientProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [teams, setTeams] = useState<string[]>([]);
  const [prediction, setPrediction] = useState<PredictionData>({
    champion: "",
    runnerUp: "",
    thirdPlace: "",
    worstTeam: "",
  });
  const [realResult, setRealResult] = useState<RealResult | null>(null);
  const [teamStats, setTeamStats] = useState<Record<string, TeamStats>>({});
  const [groupPredictions, setGroupPredictions] = useState<GroupPredEntry[]>([]);

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/groups/${groupId}/tournament-predictions`);
      if (!response.ok) {
        throw new Error("No se pudieron cargar las predicciones del torneo.");
      }
      const data = await response.json();
      setHasStarted(data.hasStarted);
      setTeams(data.teams);
      setPrediction({
        champion: data.prediction?.champion || "",
        runnerUp: data.prediction?.runnerUp || "",
        thirdPlace: data.prediction?.thirdPlace || "",
        worstTeam: data.prediction?.worstTeam || "",
      });
      setRealResult(data.realResult);
      setTeamStats(data.teamStats || {});
      setGroupPredictions(data.groupPredictions || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al cargar predicciones.");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    // Client-side validation: Podium selections cannot be duplicates
    const podiumSelections = [prediction.champion, prediction.runnerUp, prediction.thirdPlace].filter(Boolean);
    const uniquePodium = new Set(podiumSelections);
    if (podiumSelections.length !== uniquePodium.size) {
      setError("No puedes elegir la misma selección para más de un puesto en el podio (Campeón, Subcampeón o Tercer puesto).");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/groups/${groupId}/tournament-predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prediction),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al guardar las predicciones.");
      }

      setSuccess("¡Tus predicciones especiales se han guardado correctamente!");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error de red.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-center py-10 text-muted-foreground select-none">Cargando predicciones del torneo...</p>;
  }

  // Calculate user points for display if started
  const getUserWorstPoints = (teamName: string | null) => {
    if (!teamName) return 0;
    return teamStats[teamName]?.points ?? 0;
  };

  const getBonusPoints = (entry: { champion: string | null; runnerUp: string | null; thirdPlace: string | null; worstTeam: string | null }) => {
    let pts = 0;
    if (realResult) {
      if (realResult.champion && entry.champion === realResult.champion) pts += 10;
      if (realResult.runnerUp && entry.runnerUp === realResult.runnerUp) pts += 8;
      if (realResult.thirdPlace && entry.thirdPlace === realResult.thirdPlace) pts += 6;
    }
    if (entry.worstTeam) {
      pts += getUserWorstPoints(entry.worstTeam);
    }
    return pts;
  };

  return (
    <div className="space-y-6">
      {/* Alert about status */}
      {!hasStarted ? (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 text-yellow-500 text-xs sm:text-sm">
          <AlertTriangle className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Predicciones abiertas</p>
            <p className="mt-0.5 text-muted-foreground">
              Puedes seleccionar y modificar tus predicciones del podio y peor selección hasta el inicio del primer partido del torneo. Una vez que comience, se bloquearán de forma definitiva para todos los usuarios.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-xs sm:text-sm">
          <CheckCircle className="size-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Predicciones bloqueadas</p>
            <p className="mt-0.5 text-muted-foreground">
              El torneo ha comenzado y las predicciones ya no pueden modificarse. A continuación puedes ver tus elecciones, tus puntos especiales acumulados y comparar tus pronósticos con los de tus amigos.
            </p>
          </div>
        </div>
      )}

      {/* Main layout */}
      {!hasStarted ? (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Trophy className="size-5 text-yellow-500" />
              Tus Pronósticos del Torneo
            </CardTitle>
            <CardDescription className="text-xs">
              Elige el podio y la selección con peor desempeño. La misma selección no se puede repetir en el podio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* PODIUM SELECTORS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Champion */}
                <div className="p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 space-y-2 relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-yellow-500/10 font-black text-6xl select-none">1</div>
                  <label className="text-xs font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-500 flex items-center gap-1.5">
                    <Star className="size-4 fill-yellow-500" />
                    Campeón Mundial (10 pts)
                  </label>
                  <select
                    value={prediction.champion || ""}
                    onChange={(e) => setPrediction({ ...prediction, champion: e.target.value })}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="">Seleccionar equipo...</option>
                    {teams.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Runner-up */}
                <div className="p-4 rounded-2xl border-border bg-muted/40 space-y-2 relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-foreground/5 font-black text-6xl select-none">2</div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Award className="size-4 text-slate-400" />
                    Subcampeón (8 pts)
                  </label>
                  <select
                    value={prediction.runnerUp || ""}
                    onChange={(e) => setPrediction({ ...prediction, runnerUp: e.target.value })}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="">Seleccionar equipo...</option>
                    {teams.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Third Place */}
                <div className="p-4 rounded-2xl border border-amber-600/10 bg-amber-600/5 space-y-2 relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-amber-600/10 font-black text-6xl select-none">3</div>
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-600 flex items-center gap-1.5">
                    <Award className="size-4 text-amber-600" />
                    Tercer Puesto (6 pts)
                  </label>
                  <select
                    value={prediction.thirdPlace || ""}
                    onChange={(e) => setPrediction({ ...prediction, thirdPlace: e.target.value })}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="">Seleccionar equipo...</option>
                    {teams.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* WORST SELECTION SELECTOR */}
              <div className="p-5 rounded-2xl border border-red-500/10 bg-red-500/5 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <ShieldAlert className="size-4" />
                    Peor Selección (Puntuación Variable)
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Elige la selección que creas que lo hará peor. Sumarás <strong>+1 punto por cada 3 goles que reciba</strong>, pero se te <strong>restará -1 punto por cada gol que marque a favor</strong>.
                  </p>
                </div>

                <select
                  value={prediction.worstTeam || ""}
                  onChange={(e) => setPrediction({ ...prediction, worstTeam: e.target.value })}
                  className="w-full sm:max-w-md h-10 rounded-xl border border-input bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                >
                  <option value="">Seleccionar equipo...</option>
                  {teams.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <div className="flex gap-2 text-[11px] text-muted-foreground bg-card/50 p-3 rounded-lg border border-border/50">
                  <Info className="size-4 shrink-0 text-red-400" />
                  <span>
                    Ejemplo: Si tu elección concede 8 goles y marca 2 goles en total, obtendrás <strong>{Math.floor(8/3)} pts</strong> por goles en contra y perderás <strong>-2 pts</strong> por goles a favor. Total neto = <strong>0 pts</strong>.
                  </span>
                </div>
              </div>

              {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20 font-medium">{error}</p>}
              {success && <p className="text-sm text-emerald-500 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 font-medium">{success}</p>}

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving} className="px-6 py-5 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90">
                  {saving ? "Guardando..." : "Guardar predicciones especiales"}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      ) : (
        /* DISPLAY SCREEN ONCE STARTED */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Champion Card */}
            <Card className="border-yellow-500/20 bg-yellow-500/5 relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-500">Campeón (10 pts)</CardDescription>
                <CardTitle className="text-lg">{prediction.champion || "No predicho"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Real: {realResult?.champion || "TBD"}</span>
                {realResult?.champion && prediction.champion && (
                  prediction.champion === realResult.champion ? (
                    <span className="flex items-center gap-0.5 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full"><CheckCircle className="size-3" /> +10 pts</span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-xs text-destructive font-bold bg-destructive/10 px-2 py-0.5 rounded-full"><XCircle className="size-3" /> 0 pts</span>
                  )
                )}
              </CardContent>
            </Card>

            {/* Runner-up Card */}
            <Card className="border-border bg-muted/20 relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subcampeón (8 pts)</CardDescription>
                <CardTitle className="text-lg">{prediction.runnerUp || "No predicho"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Real: {realResult?.runnerUp || "TBD"}</span>
                {realResult?.runnerUp && prediction.runnerUp && (
                  prediction.runnerUp === realResult.runnerUp ? (
                    <span className="flex items-center gap-0.5 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full"><CheckCircle className="size-3" /> +8 pts</span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-xs text-destructive font-bold bg-destructive/10 px-2 py-0.5 rounded-full"><XCircle className="size-3" /> 0 pts</span>
                  )
                )}
              </CardContent>
            </Card>

            {/* Third Place Card */}
            <Card className="border-amber-600/10 bg-amber-600/5 relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-600">Tercer Puesto (6 pts)</CardDescription>
                <CardTitle className="text-lg">{prediction.thirdPlace || "No predicho"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Real: {realResult?.thirdPlace || "TBD"}</span>
                {realResult?.thirdPlace && prediction.thirdPlace && (
                  prediction.thirdPlace === realResult.thirdPlace ? (
                    <span className="flex items-center gap-0.5 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full"><CheckCircle className="size-3" /> +6 pts</span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-xs text-destructive font-bold bg-destructive/10 px-2 py-0.5 rounded-full"><XCircle className="size-3" /> 0 pts</span>
                  )
                )}
              </CardContent>
            </Card>

            {/* Worst Team Card */}
            <Card className="border-red-500/10 bg-red-500/5 relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Peor Selección</CardDescription>
                <CardTitle className="text-lg">{prediction.worstTeam || "No predicho"}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 flex flex-col space-y-1">
                {prediction.worstTeam ? (
                  <>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>GC: {teamStats[prediction.worstTeam]?.conceded ?? 0} · GF: {teamStats[prediction.worstTeam]?.scored ?? 0}</span>
                      <span className="font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-full">{getUserWorstPoints(prediction.worstTeam)} pts</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin elecciones registradas</span>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Group Comparison Table */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Trophy className="size-4.5 text-primary" />
                Comparativa del Grupo
              </CardTitle>
              <CardDescription className="text-xs">
                Mira las predicciones especiales de los demás miembros del grupo.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted text-muted-foreground text-xs uppercase font-semibold select-none">
                    <tr>
                      <th className="px-4 py-3">Usuario</th>
                      <th className="px-4 py-3">Campeón</th>
                      <th className="px-4 py-3">Subcampeón</th>
                      <th className="px-4 py-3">Tercer Puesto</th>
                      <th className="px-4 py-3">Peor Selección</th>
                      <th className="px-4 py-3 text-right">Pts Especiales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {groupPredictions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-xs text-muted-foreground select-none">
                          Nadie ha realizado predicciones especiales aún.
                        </td>
                      </tr>
                    ) : (
                      groupPredictions.map((entry) => {
                        const isUserSelf = entry.userId === currentUserId;
                        const worstPts = getUserWorstPoints(entry.worstTeam);
                        const totalBonus = getBonusPoints(entry);

                        return (
                          <tr key={entry.userId} className={`hover:bg-muted/30 transition ${isUserSelf ? "bg-primary/5 font-semibold" : ""}`}>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              {entry.nick} {isUserSelf && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded ml-1 font-bold">Tú</span>}
                            </td>
                            <td className={`px-4 py-3.5 whitespace-nowrap ${realResult?.champion && entry.champion === realResult.champion ? "text-emerald-500 font-bold" : ""}`}>
                              {entry.champion || "—"}
                            </td>
                            <td className={`px-4 py-3.5 whitespace-nowrap ${realResult?.runnerUp && entry.runnerUp === realResult.runnerUp ? "text-emerald-500 font-bold" : ""}`}>
                              {entry.runnerUp || "—"}
                            </td>
                            <td className={`px-4 py-3.5 whitespace-nowrap ${realResult?.thirdPlace && entry.thirdPlace === realResult.thirdPlace ? "text-emerald-500 font-bold" : ""}`}>
                              {entry.thirdPlace || "—"}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                              {entry.worstTeam ? (
                                <div className="space-y-0.5">
                                  <div>{entry.worstTeam}</div>
                                  <div className="text-[10px] text-muted-foreground">
                                    GC: {teamStats[entry.worstTeam]?.conceded ?? 0} / GF: {teamStats[entry.worstTeam]?.scored ?? 0} ({worstPts} pts)
                                  </div>
                                </div>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap text-right font-bold text-primary">
                              {totalBonus} pts
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
