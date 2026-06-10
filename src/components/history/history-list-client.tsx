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
  pointsEarned: number;
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
      <p className="text-sm text-muted-foreground">Cargando historial...</p>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const history = data?.history ?? [];

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
        Aún no tienes partidos finalizados con puntuación en este grupo.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border rounded-2xl border border-border">
        {history.map((item) => (
          <li key={item.id} className="px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={`/grupos/${groupId}/partidos/${item.matchId}`}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium hover:underline"
                >
                  {item.match.homeTeamCrest && (
                    <img
                      src={item.match.homeTeamCrest}
                      alt={`Bandera de ${item.match.homeTeam}`}
                      className="inline-block h-3.5 w-5 object-cover rounded-sm border border-muted/60"
                    />
                  )}
                  <span>{item.match.homeTeam}</span>
                  <span className="text-muted-foreground font-normal mx-0.5 text-sm">vs</span>
                  {item.match.awayTeamCrest && (
                    <img
                      src={item.match.awayTeamCrest}
                      alt={`Bandera de ${item.match.awayTeam}`}
                      className="inline-block h-3.5 w-5 object-cover rounded-sm border border-muted/60"
                    />
                  )}
                  <span>{item.match.awayTeam}</span>
                </Link>
                <p className="text-xs text-muted-foreground">
                  {item.match.phase} ·{" "}
                  {new Date(item.match.date).toLocaleString("es-ES")}
                </p>
                <p className="mt-2 text-sm">
                  Tu predicción:{" "}
                  {formatScore(
                    item.predictionHomeGoals,
                    item.predictionAwayGoals
                  )}{" "}
                  ({formatResultType(item.resultType)})
                </p>
                <p className="text-sm text-muted-foreground">
                  Resultado:{" "}
                  {formatScore(item.match.homeGoals, item.match.awayGoals)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">+{item.pointsEarned}</p>
                <p className="text-xs text-muted-foreground">puntos</p>
              </div>
            </div>
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
