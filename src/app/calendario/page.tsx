"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGroup } from "@/components/providers/group-provider";
import { MatchesListClient } from "@/components/matches/matches-list-client";
import { Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CalendarioPage() {
  const { selectedGroupId, selectedGroup, groups, isLoadingGroups } = useGroup();
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingGroups && groups.length === 0) {
      router.replace("/grupos");
    }
  }, [isLoadingGroups, groups, router]);

  if (isLoadingGroups) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-muted-foreground animate-pulse">
        Cargando calendario...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 select-none">
            <Calendar className="size-5 text-accent" />
            Calendario de Partidos
          </h1>
          <p className="text-xs text-muted-foreground">
            Consulta los marcadores, partidos en juego y programa tus próximos pronósticos
          </p>
        </div>
      </div>

      {selectedGroupId ? (
        <div className="space-y-4">
          <div className="bg-card px-4 py-2.5 rounded-xl border border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground select-none">
              Mostrando partidos con contexto de grupo:
            </span>
            <span className="text-xs font-bold text-accent">
              {selectedGroup?.name}
            </span>
          </div>
          <MatchesListClient groupId={selectedGroupId} />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-4 max-w-md mx-auto mt-8">
          <div className="size-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <AlertCircle className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-foreground">Sin grupo activo</p>
            <p className="text-xs text-muted-foreground">
              Debes estar en un grupo para poder ver el calendario de partidos y enviar tus predicciones.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/grupos/nuevo">Crear grupo</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/grupos/unirse">Unirse a uno</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
