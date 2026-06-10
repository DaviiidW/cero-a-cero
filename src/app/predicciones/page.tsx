"use client";

import { useGroup } from "@/components/providers/group-provider";
import { HistoryListClient } from "@/components/history/history-list-client";
import { ClipboardList, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrediccionesPage() {
  const { selectedGroupId, selectedGroup, isLoadingGroups } = useGroup();

  if (isLoadingGroups) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-muted-foreground animate-pulse">
        Cargando tus predicciones...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 select-none">
            <ClipboardList className="size-5 text-accent" />
            Mis Predicciones
          </h1>
          <p className="text-xs text-muted-foreground">
            Revisa tus aciertos, marcadores pronosticados y puntos ganados en el grupo activo
          </p>
        </div>
      </div>

      {selectedGroupId ? (
        <div className="space-y-4">
          <div className="bg-card px-4 py-2.5 rounded-xl border border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground select-none">
              Mostrando predicciones para el grupo:
            </span>
            <span className="text-xs font-bold text-accent">
              {selectedGroup?.name}
            </span>
          </div>
          <HistoryListClient groupId={selectedGroupId} />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center space-y-4 max-w-md mx-auto mt-8">
          <div className="size-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <AlertCircle className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-foreground">Sin grupo activo</p>
            <p className="text-xs text-muted-foreground">
              Debes tener un grupo seleccionado para poder registrar predicciones y consultar tu historial.
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
