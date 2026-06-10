"use client";

import Link from "next/link";
import { usePolling } from "@/hooks/use-polling";
import { formatResultType, formatScore } from "@/lib/scoring/labels";
import type { ResultTypeLabel } from "@/lib/scoring/labels";

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
  };
};

type HistoryResponse = {
  history: HistoryItem[];
  updatedAt: string;
};

export function HistoryListClient({ groupId }: HistoryListClientProps) {
  const { data, error, isLoading } = usePolling<HistoryResponse>(async () => {
    const response = await fetch(`/api/groups/${groupId}/history`);
    if (!response.ok) {
      throw new Error("No se pudo cargar el historial");
    }
    return response.json();
  });

  if (isLoading && !data) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-card border border-border/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const history = data?.history ?? [];

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground select-none">
        Aún no tienes predicciones enviadas o partidos finalizados en este grupo.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {history.map((item) => {
          const isPending = item.pointsEarned === null;
          const hasPoints = item.pointsEarned !== null && item.pointsEarned > 0;
          
          return (
            <li 
              key={item.id} 
              className={`p-4 rounded-2xl border bg-card transition-all duration-200 hover:shadow-sm ${
                isPending 
                  ? "border-amber-500/30" 
                  : hasPoints 
                    ? "border-primary/40 shadow-primary/5" 
                    : "border-border/60"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                
                {/* Match details & Teams */}
                <div className="min-w-0 flex-1 space-y-2">
                  <Link
                    href={`/grupos/${groupId}/partidos/${item.matchId}`}
                    className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-bold text-foreground hover:text-primary transition"
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
                  
                  {/* Meta details */}
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

                  {/* Predictions vs Actual */}
                  <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-2 text-[11px] font-semibold">
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground text-[10px] font-medium block">Tu Predicción</span>
                      <span className="text-foreground">
                        {item.predictionHomeGoals} - {item.predictionAwayGoals}{" "}
                        <span className="text-[9px] font-bold text-accent uppercase tracking-wider px-1 bg-accent/10 rounded border border-accent/20">
                          {formatResultType(item.resultType)}
                        </span>
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

                {/* Score badge / status */}
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
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg animate-pulse">
                      En juego
                    </span>
                  )}
                </div>

              </div>
            </li>
          );
        })}
      </ul>
        {data?.updatedAt ? (
          <p className="text-[10px] text-muted-foreground text-right italic select-none">
            Última actualización: {new Date(data.updatedAt).toLocaleTimeString("es-ES")} (auto-update 30s)
          </p>
        ) : null}
    </div>
  );
}
