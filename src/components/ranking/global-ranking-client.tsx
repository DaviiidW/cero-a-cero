"use client";

import { RankingTable } from "@/components/ranking/ranking-table";
import { usePolling } from "@/hooks/use-polling";

type GlobalRankingClientProps = {
  currentUserId: string;
};

type RankingResponse = {
  ranking: Array<{
    userId: string;
    nick: string;
    points: number;
    position: number;
  }>;
  updatedAt: string;
};

export function GlobalRankingClient({ currentUserId }: GlobalRankingClientProps) {
  const { data, error, isLoading } = usePolling<RankingResponse>(async () => {
    const response = await fetch("/api/ranking/global");
    if (!response.ok) {
      throw new Error("No se pudo cargar el ranking global");
    }
    return response.json();
  });

  if (isLoading && !data) {
    return (
      <p className="text-sm text-muted-foreground">Cargando ranking...</p>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-2">
      <RankingTable
        rows={data?.ranking ?? []}
        highlightUserId={currentUserId}
        emptyMessage="Aún no hay puntuaciones en la plataforma."
      />
      {data?.updatedAt ? (
        <p className="text-xs text-muted-foreground">
          Actualizado: {new Date(data.updatedAt).toLocaleTimeString("es-ES")}
          {" · "}se actualiza automáticamente cada 30 s
        </p>
      ) : null}
    </div>
  );
}
