"use client";

import Link from "next/link";
import { usePolling } from "@/hooks/use-polling";
import { formatScore } from "@/lib/scoring/labels";

type MatchesListClientProps = {
  groupId: string;
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

type MatchesResponse = {
  matches: MatchItem[];
  updatedAt: string;
};

function getStatusBadge(status: string) {
  switch (status) {
    case "FINISHED":
      return (
        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-muted text-muted-foreground border border-border select-none">
          Finalizado
        </span>
      );
    case "LIVE":
      return (
        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse select-none">
          En Juego
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-primary/10 text-primary border border-primary/20 select-none">
          Programado
        </span>
      );
  }
}

export function MatchesListClient({ groupId }: MatchesListClientProps) {
  const { data, error, isLoading } = usePolling<MatchesResponse>(async () => {
    const response = await fetch("/api/matches");
    if (!response.ok) {
      throw new Error("No se pudieron cargar los partidos");
    }
    return response.json();
  });

  if (isLoading && !data) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-card border border-border/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const matches = data?.matches ?? [];

  if (matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
        No hay partidos sincronizados todavía.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2.5">
        {matches.map((match) => {
          const isLive = match.status === "LIVE";
          const isFinished = match.status === "FINISHED";
          
          return (
            <li 
              key={match.id}
              className={`rounded-2xl border transition-all duration-200 hover:scale-[1.01] hover:shadow-sm ${
                isLive 
                  ? "border-red-500/40 bg-red-500/5 shadow-red-500/5" 
                  : isFinished
                    ? "border-border/60 bg-muted/20 opacity-80"
                    : "border-border bg-card"
              }`}
            >
              <Link
                href={`/grupos/${groupId}/partidos/${match.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3.5"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-bold text-foreground">
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
                  </div>
                  <p className="text-[11px] text-muted-foreground font-medium">
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
                </div>
                
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-base font-extrabold tracking-tight ${isLive ? "text-red-500" : isFinished ? "text-foreground/90" : "text-muted-foreground"}`}>
                    {formatScore(match.homeGoals, match.awayGoals)}
                  </span>
                  {getStatusBadge(match.status)}
                </div>
              </Link>
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
