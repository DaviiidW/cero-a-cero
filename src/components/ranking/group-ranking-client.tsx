"use client";

import { useState, useEffect } from "react";
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
    matchPoints?: number;
    bonusPoints?: number;
    exactCount?: number;
  }>;
  availableJornadas?: number[];
  updatedAt: string;
};

const FILTER_OPTIONS = [
  { key: "total", label: "Total", value: "total" },
  { key: "j1", label: "J1", value: "1", jornada: 1 },
  { key: "j2", label: "J2", value: "2", jornada: 2 },
  { key: "j3", label: "J3", value: "3", jornada: 3 },
  { key: "group_stage", label: "Fase de grupos", value: "1,2,3", jornadas: [1, 2, 3] },
  { key: "j4", label: "1/16", value: "4", jornada: 4 },
  { key: "j5", label: "1/8", value: "5", jornada: 5 },
  { key: "j6", label: "1/4", value: "6", jornada: 6 },
  { key: "j7", label: "1/2", value: "7", jornada: 7 },
  { key: "j8", label: "1/1", value: "8", jornada: 8 },
];

export function GroupRankingClient({
  groupId,
  currentUserId,
}: GroupRankingClientProps) {
  const [filter, setFilter] = useState<string>("total");
  const [isChangingFilter, setIsChangingFilter] = useState(false);

  const { data, error, isLoading, refresh } = usePolling<RankingResponse>(async () => {
    const response = await fetch(`/api/groups/${groupId}/ranking?jornada=${filter}`);
    if (!response.ok) {
      throw new Error("No se pudo cargar la clasificación");
    }
    return response.json();
  });

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setIsChangingFilter(true);
  };

  useEffect(() => {
    refresh().finally(() => setIsChangingFilter(false));
  }, [filter, refresh]);

  if (isLoading && !data) {
    return (
      <p className="text-sm text-muted-foreground animate-pulse">Cargando clasificación...</p>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const availableJornadas = data?.availableJornadas ?? [];

  const visibleFilters = FILTER_OPTIONS.filter((opt) => {
    if (opt.key === "total") return true;
    if (opt.jornada !== undefined) {
      return availableJornadas.includes(opt.jornada);
    }
    if (opt.jornadas !== undefined) {
      return opt.jornadas.some((j) => availableJornadas.includes(j));
    }
    return false;
  });

  const showLoading = (isLoading && !data) || isChangingFilter;

  return (
    <div className="space-y-4">
      {/* Botones de Filtro */}
      <div className="flex flex-row gap-1.5 p-1 bg-muted/65 rounded-xl border border-border/50 overflow-x-auto scrollbar-none select-none justify-start">
        {visibleFilters.map((opt) => (
          <button
            key={opt.key}
            onClick={() => handleFilterChange(opt.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              filter === opt.value
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className={`transition-opacity duration-200 ${showLoading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
        <RankingTable
          rows={data?.ranking ?? []}
          highlightUserId={currentUserId}
        />
      </div>

      {data?.updatedAt ? (
        <p className="text-xs text-muted-foreground">
          Clasificación actualizada: {new Date(data.updatedAt).toLocaleString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      ) : null}
    </div>
  );
}
