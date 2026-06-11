"use client";

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useGroup } from "@/components/providers/group-provider";
import { HistoryListClient } from "@/components/history/history-list-client";
import { TournamentPredictionsClient } from "@/components/groups/tournament-predictions-client";
import { ClipboardList, AlertCircle, Calendar, Trophy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrediccionesPage() {
  const { selectedGroupId, selectedGroup, isLoadingGroups } = useGroup();
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"matches" | "special">("matches");

  const currentUserId = session?.user?.id;

  if (isLoadingGroups) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-muted-foreground animate-pulse">
        Cargando tus predicciones...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Cabecera */}
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
        <div className="space-y-6">
          {/* Info del Grupo Activo */}
          <div className="bg-card px-4 py-2.5 rounded-xl border border-border flex items-center justify-between shadow-sm">
            <span className="text-xs font-semibold text-muted-foreground select-none">
              Grupo activo:
            </span>
            <span className="text-xs font-extrabold text-accent">
              {selectedGroup?.name}
            </span>
          </div>

          {/* Selector de Pestañas */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/65 rounded-xl border border-border/50 max-w-md mx-auto select-none">
            <button
              onClick={() => setActiveTab("matches")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "matches"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="size-3.5" />
              Predicciones de Partidos
            </button>
            <button
              onClick={() => setActiveTab("special")}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === "special"
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trophy className="size-3.5" />
              Predicciones Especiales
            </button>
          </div>

          {/* Contenido Condicional */}
          {activeTab === "matches" ? (
            <Suspense fallback={
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl border border-border/60 animate-pulse bg-card/60" />
                ))}
              </div>
            }>
              <HistoryListClient groupId={selectedGroupId} />
            </Suspense>
          ) : (
            currentUserId ? (
              <TournamentPredictionsClient groupId={selectedGroupId} currentUserId={currentUserId} />
            ) : (
              <div className="text-center py-8 text-xs text-muted-foreground">
                Cargando tu información de usuario...
              </div>
            )
          )}
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
