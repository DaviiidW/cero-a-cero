import { useEffect } from "react";
import Link from "next/link";
import { usePolling } from "@/hooks/use-polling";
import { formatScore } from "@/lib/scoring/labels";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
        <Badge variant="secondary" className="text-[10px] font-bold uppercase rounded py-0.5 px-2 text-muted-foreground select-none">
          Finalizado
        </Badge>
      );
    case "LIVE":
      return (
        <Badge variant="destructive" className="text-[10px] font-bold uppercase rounded py-0.5 px-2 animate-pulse select-none bg-red-500/10 text-red-500 border-red-500/20">
          En Juego
        </Badge>
      );
    default:
      return (
        <Badge variant="gold" className="text-[10px] font-bold uppercase rounded py-0.5 px-2 select-none">
          Programado
        </Badge>
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

  // Save scroll position when navigating away
  const handleLinkClick = () => {
    window.sessionStorage.setItem("scroll-position-calendario", window.scrollY.toString());
  };

  // Restore scroll position
  useEffect(() => {
    if (!isLoading && data) {
      const timer = setTimeout(() => {
        const savedScroll = window.sessionStorage.getItem("scroll-position-calendario");
        if (savedScroll) {
          window.scrollTo(0, parseInt(savedScroll, 10));
          window.sessionStorage.removeItem("scroll-position-calendario");
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, data]);

  if (isLoading && !data) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="h-16 border-border/60 animate-pulse bg-card/60" />
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
            <li key={match.id}>
              <Card className={`transition-all duration-200 hover:scale-[1.01] hover:shadow-sm ${
                isLive 
                  ? "border-red-500/40 bg-red-500/5 shadow-red-500/5" 
                  : isFinished
                    ? "border-border/60 bg-muted/20 opacity-80"
                    : "border-border bg-card"
              }`}>
                <CardContent className="p-0">
                  <Link
                    href={`/grupos/${groupId}/partidos/${match.id}?from=calendario`}
                    className="flex items-center justify-between gap-4 px-4 py-3.5"
                    onClick={handleLinkClick}
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
                </CardContent>
              </Card>
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
