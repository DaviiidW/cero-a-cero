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

function getStatusLabel(status: string) {
  switch (status) {
    case "FINISHED":
      return "Finalizado";
    case "LIVE":
      return "En juego";
    default:
      return "Programado";
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
      <p className="text-sm text-muted-foreground">Cargando partidos...</p>
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
    <div className="space-y-3">
      <ul className="divide-y divide-border rounded-2xl border border-border">
        {matches.map((match) => (
          <li key={match.id}>
            <Link
              href={`/grupos/${groupId}/partidos/${match.id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-muted/40"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                  {match.homeTeamCrest && (
                    <img
                      src={match.homeTeamCrest}
                      alt={`Bandera de ${match.homeTeam}`}
                      className="inline-block h-3.5 w-5 object-cover rounded-sm border border-muted/60"
                    />
                  )}
                  <span>{match.homeTeam}</span>
                  <span className="text-muted-foreground font-normal mx-0.5 text-sm">vs</span>
                  {match.awayTeamCrest && (
                    <img
                      src={match.awayTeamCrest}
                      alt={`Bandera de ${match.awayTeam}`}
                      className="inline-block h-3.5 w-5 object-cover rounded-sm border border-muted/60"
                    />
                  )}
                  <span>{match.awayTeam}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {match.phase}
                  {match.groupStageNumber
                    ? ` · Jornada ${match.groupStageNumber}`
                    : ""}
                  {" · "}
                  {new Date(match.date).toLocaleString("es-ES")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {formatScore(match.homeGoals, match.awayGoals)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getStatusLabel(match.status)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {data?.updatedAt ? (
        <p className="text-xs text-muted-foreground">
          Actualizado: {new Date(data.updatedAt).toLocaleTimeString("es-ES")}
        </p>
      ) : null}
    </div>
  );
}
