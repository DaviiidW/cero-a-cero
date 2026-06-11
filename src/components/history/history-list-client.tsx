"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePolling } from "@/hooks/use-polling";
import { formatResultType, formatScore } from "@/lib/scoring/labels";
import type { ResultTypeLabel } from "@/lib/scoring/labels";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ListTodo, CheckCircle2, Clock } from "lucide-react";

type HistoryListClientProps = {
  groupId: string;
};

type HistoryItem = {
  id: string;
  matchId: string;
  predictionHomeGoals: number;
  predictionAwayGoals: number;
  resultType: ResultTypeLabel;
  pointsEarned: number | null;
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeTeamCrest?: string | null;
    awayTeamCrest?: string | null;
    date: string;
    phase: string;
    homeGoals: number | null;
    awayGoals: number | null;
    status: string;
  };
};

type MatchItem = {
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

type CombinedResponse = {
  history: HistoryItem[];
  matches: MatchItem[];
  updatedAt: string;
};

export function HistoryListClient({ groupId }: HistoryListClientProps) {
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") as "realizadas" | "finalizadas" | "pendientes" | null;
  const initialFilter = urlFilter || "realizadas";
  
  const [filter, setFilter] = useState<"realizadas" | "finalizadas" | "pendientes">(initialFilter);

  // Sync filter state with URL parameter if it changes (e.g. going back/forward in browser history)
  useEffect(() => {
    const targetFilter = urlFilter || "realizadas";
    if (targetFilter !== filter) {
      setFilter(targetFilter);
    }
  }, [urlFilter, filter]);

  const { data, error, isLoading } = usePolling<CombinedResponse>(async () => {
    const [historyRes, matchesRes] = await Promise.all([
      fetch(`/api/groups/${groupId}/history`),
      fetch("/api/matches"),
    ]);
    if (!historyRes.ok || !matchesRes.ok) {
      throw new Error("No se pudo cargar la información de predicciones o partidos");
    }
    const historyData = await historyRes.json();
    const matchesData = await matchesRes.json();
    
    return {
      history: historyData.history || [],
      matches: matchesData.matches || [],
      updatedAt: new Date().toISOString(),
    };
  });

  // Save scroll position when navigating away
  const handleLinkClick = () => {
    window.sessionStorage.setItem("scroll-position-predicciones", window.scrollY.toString());
  };

  // Update URL search params when changing filters
  const handleFilterChange = (newFilter: "realizadas" | "finalizadas" | "pendientes") => {
    setFilter(newFilter);
    const params = new URLSearchParams(window.location.search);
    params.set("filter", newFilter);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  };

  // Restore scroll position
  useEffect(() => {
    if (!isLoading && data) {
      const timer = setTimeout(() => {
        const savedScroll = window.sessionStorage.getItem("scroll-position-predicciones");
        if (savedScroll) {
          window.scrollTo(0, parseInt(savedScroll, 10));
          window.sessionStorage.removeItem("scroll-position-predicciones");
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, data, filter]);

  if (isLoading && !data) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-24 border-border/60 animate-pulse bg-card/60" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const history = data?.history ?? [];
  const matches = data?.matches ?? [];

  // ID de los partidos que ya tienen predicción
  const predictedMatchIds = new Set(history.map((item) => item.matchId));

  // 1. Filtrado de predicciones realizadas (HECHAS pero NO finalizadas) y finalizadas (HECHAS y finalizadas)
  const filteredHistory = history.filter((item) => {
    if (filter === "realizadas") {
      return item.match.status !== "FINISHED";
    }
    if (filter === "finalizadas") {
      return item.match.status === "FINISHED";
    }
    return false;
  });

  // 2. Filtrado de partidos pendientes (NO predichos y NO finalizados)
  const pendingMatches = matches.filter((match) => {
    return match.status !== "FINISHED" && !predictedMatchIds.has(match.id);
  });

  return (
    <div className="space-y-4">
      {/* Botones de Filtro */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 select-none pb-1">
        <button
          onClick={() => handleFilterChange("realizadas")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
            filter === "realizadas"
              ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/10"
              : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          }`}
        >
          <ListTodo className="size-3.5" />
          Realizadas
        </button>
        <button
          onClick={() => handleFilterChange("finalizadas")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
            filter === "finalizadas"
              ? "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30 shadow-sm"
              : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="size-3.5" />
          Finalizadas
        </button>
        <button
          onClick={() => handleFilterChange("pendientes")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
            filter === "pendientes"
              ? "bg-amber-600 text-white border-amber-600 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30 shadow-sm"
              : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          }`}
        >
          <Clock className="size-3.5" />
          Pendientes
        </button>
      </div>

      {filter === "pendientes" ? (
        pendingMatches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground text-xs select-none">
            ¡Al día! No tienes partidos pendientes por pronosticar.
          </div>
        ) : (
          <ul className="space-y-3">
            {pendingMatches.map((match) => {
              const isLive = match.status === "LIVE";
              const isLocked = match.status !== "SCHEDULED" || (new Date(match.date).getTime() - new Date().getTime() < 3 * 60 * 1000);
              
              return (
                <li key={match.id}>
                  <Card className={`transition-all duration-200 hover:scale-[1.01] hover:shadow-sm ${
                    isLive 
                      ? "border-red-500/40 bg-red-500/5 shadow-sm shadow-red-500/5" 
                      : "border-dashed border-border/80 bg-card/40"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        
                        {/* Detalles del partido */}
                        <div className="min-w-0 flex-1 space-y-2">
                          <Link
                            href={`/grupos/${groupId}/partidos/${match.id}?from=predicciones`}
                            className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-bold text-foreground hover:text-primary transition"
                            onClick={handleLinkClick}
                          >
                            {match.homeTeamCrest && (
                              <img
                                src={match.homeTeamCrest}
                                alt={`Bandera de ${match.homeTeam}`}
                                className="inline-block h-3.5 w-5 object-cover rounded-sm border border-muted/50"
                              />
                            )}
                            <span>{match.homeTeam}</span>
                            <span className="text-muted-foreground font-normal text-xs select-none">vs</span>
                            {match.awayTeamCrest && (
                              <img
                                src={match.awayTeamCrest}
                                alt={`Bandera de ${match.awayTeam}`}
                                className="inline-block h-3.5 w-5 object-cover rounded-sm border border-muted/50"
                              />
                            )}
                            <span>{match.awayTeam}</span>
                          </Link>
                          
                          {/* Detalles meta */}
                          <p className="text-[10px] text-muted-foreground font-medium">
                            <span className="text-accent font-semibold">{match.phase}</span>
                            {match.groupStageNumber ? ` · Jornada ${match.groupStageNumber}` : ""}
                            {" · "}
                            {new Date(match.date).toLocaleString("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
    
                          {/* Predicción vs Real */}
                          <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-2 text-[11px] font-semibold">
                            <div className="space-y-0.5">
                              <span className="text-muted-foreground text-[10px] font-medium block">Tu Predicción</span>
                              <span className="text-muted-foreground italic text-xs">
                                {isLocked ? "No pronosticado (Cerrado)" : "Sin pronóstico"}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-muted-foreground text-[10px] font-medium block">Marcador Real</span>
                              <span className="text-foreground font-bold">
                                {formatScore(match.homeGoals, match.awayGoals)}
                              </span>
                            </div>
                          </div>
                        </div>
    
                        {/* Estado o botón de acción */}
                        <div className="text-right shrink-0 select-none">
                          {isLocked ? (
                            <Badge 
                              variant="secondary" 
                              className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 bg-muted text-muted-foreground border border-border rounded-lg"
                            >
                              Cerrado
                            </Badge>
                          ) : (
                            <Button asChild size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-sm" onClick={handleLinkClick}>
                              <Link href={`/grupos/${groupId}/partidos/${match.id}?from=predicciones`}>
                                Pronosticar
                              </Link>
                            </Button>
                          )}
                        </div>
    
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )
      ) : (
        filteredHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground text-xs select-none">
            {filter === "finalizadas" && "No tienes predicciones finalizadas en este grupo."}
            {filter === "realizadas" && "No tienes predicciones activas pendientes de juego."}
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredHistory.map((item) => {
              const isPending = item.pointsEarned === null;
              const hasPoints = item.pointsEarned !== null && item.pointsEarned > 0;
              
              return (
                <li key={item.id}>
                  <Card className={`transition-all duration-200 hover:shadow-sm ${
                    isPending 
                      ? item.match.status === "LIVE"
                        ? "border-amber-500/40 bg-amber-500/5 shadow-sm shadow-amber-500/5"
                        : "border-border/60"
                      : hasPoints 
                        ? "border-primary/40 shadow-primary/5 bg-primary/5" 
                        : "border-border/60"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        
                        {/* Detalles del partido */}
                        <div className="min-w-0 flex-1 space-y-2">
                          <Link
                            href={`/grupos/${groupId}/partidos/${item.matchId}?from=predicciones`}
                            className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-bold text-foreground hover:text-primary transition"
                            onClick={handleLinkClick}
                          >
                            {item.match.homeTeamCrest && (
                              <img
                                src={item.match.homeTeamCrest}
                                alt={`Bandera de ${item.match.homeTeam}`}
                                className="inline-block h-3.5 w-5 object-cover rounded-sm border border-muted/50"
                              />
                            )}
                            <span>{item.match.homeTeam}</span>
                            <span className="text-muted-foreground font-normal text-xs select-none">vs</span>
                            {item.match.awayTeamCrest && (
                              <img
                                src={item.match.awayTeamCrest}
                                alt={`Bandera de ${item.match.awayTeam}`}
                                className="inline-block h-3.5 w-5 object-cover rounded-sm border border-muted/50"
                              />
                            )}
                            <span>{item.match.awayTeam}</span>
                          </Link>
                          
                          {/* Detalles meta */}
                          <p className="text-[10px] text-muted-foreground font-medium">
                            <span className="text-accent font-semibold">{item.match.phase}</span>
                            {" · "}
                            {new Date(item.match.date).toLocaleString("es-ES", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
    
                          {/* Predicción vs Real */}
                          <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-2 text-[11px] font-semibold">
                            <div className="space-y-0.5">
                              <span className="text-muted-foreground text-[10px] font-medium block">Tu Predicción</span>
                              <span className="text-foreground">
                                {item.predictionHomeGoals} - {item.predictionAwayGoals}{" "}
                                <Badge variant="gold" className="text-[9px] font-bold uppercase tracking-wider py-0 px-1 border-accent/20">
                                  {formatResultType(item.resultType)}
                                </Badge>
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-muted-foreground text-[10px] font-medium block">Marcador Real</span>
                              <span className="text-foreground font-bold">
                                {formatScore(item.match.homeGoals, item.match.awayGoals)}
                              </span>
                            </div>
                          </div>
                        </div>
    
                        {/* Estado o puntos */}
                        <div className="text-right shrink-0 select-none">
                          {item.pointsEarned !== null ? (
                            <div className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-16 border ${
                              hasPoints 
                                ? "bg-primary/10 text-primary border-primary/20" 
                                : "bg-muted text-muted-foreground border-border"
                            }`}>
                              <span className="text-xl font-black leading-none">+{item.pointsEarned}</span>
                              <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">puntos</span>
                            </div>
                          ) : (
                            item.match.status === "LIVE" || (new Date(item.match.date).getTime() - new Date().getTime() < 3 * 60 * 1000) ? (
                              <Badge 
                                variant="secondary" 
                                className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 border rounded-lg bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                              >
                                En juego
                              </Badge>
                            ) : (
                              <Button asChild size="sm" variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 font-bold text-xs rounded-xl shadow-sm" onClick={handleLinkClick}>
                                <Link href={`/grupos/${groupId}/partidos/${item.matchId}?from=predicciones`}>
                                  Editar
                                </Link>
                              </Button>
                            )
                          )}
                        </div>
    
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )
      )}
      {data?.updatedAt ? (
        <p className="text-[10px] text-muted-foreground text-right italic select-none">
          Última actualización: {new Date(data.updatedAt).toLocaleTimeString("es-ES")} (auto-update 30s)
        </p>
      ) : null}
    </div>
  );
}
