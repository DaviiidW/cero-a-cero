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
                <p className="font-medium">
                  {match.homeTeam} vs {match.awayTeam}
                </p>
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
