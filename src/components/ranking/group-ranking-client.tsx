"use client";

import { RankingTable } from "@/components/ranking/ranking-table";
import { usePolling } from "@/hooks/use-polling";

type GroupRankingClientProps = {
  groupId: string;
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

export function GroupRankingClient({
  groupId,
  currentUserId,
}: GroupRankingClientProps) {
  const { data, error, isLoading } = usePolling<RankingResponse>(async () => {
    const response = await fetch(`/api/groups/${groupId}/ranking`);
    if (!response.ok) {
      throw new Error("No se pudo cargar la clasificación");
    }
    return response.json();
  });

  if (isLoading && !data) {
    return (
      <p className="text-sm text-muted-foreground">Cargando clasificación...</p>
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
