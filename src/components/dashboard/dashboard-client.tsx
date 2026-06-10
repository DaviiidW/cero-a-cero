"use client";

import Link from "next/link";
import { useGroup } from "@/components/providers/group-provider";
import { GroupRankingClient } from "@/components/ranking/group-ranking-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, PlusCircle, ArrowRight, Shield } from "lucide-react";

type DashboardClientProps = {
  currentUserId: string;
};

export function DashboardClient({ currentUserId }: DashboardClientProps) {
  const { selectedGroupId, selectedGroup, groups, isLoadingGroups } = useGroup();

  if (isLoadingGroups) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Cargando clasificación y grupos...</p>
      </div>
    );
  }

  // User has no groups
  if (groups.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center space-y-6">
        <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner border border-primary/20">
          <Trophy className="size-8 stroke-[1.8px]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">¡Te damos la bienvenida a Cero a Cero!</h2>
          <p className="text-sm text-muted-foreground">
            Para empezar a pronosticar los partidos del Mundial 2026 y competir en la porra, necesitas unirte o crear un grupo con tus amigos.
          </p>
        </div>
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 space-y-3">
            <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/grupos/nuevo" className="flex items-center justify-center gap-2 font-bold">
                <PlusCircle className="size-4" />
                Crear un nuevo grupo
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/grupos/unirse" className="flex items-center justify-center gap-2 font-bold">
                <Users className="size-4" />
                Unirse a un grupo existente
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Selected group ranking view
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {selectedGroup && (
        <Card className="border-border shadow-sm">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="gold" className="text-[9px] uppercase tracking-wider font-bold py-0.5 px-2">
                  <Shield className="size-3 mr-1 inline" />
                  Grupo Activo
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{selectedGroup.name}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>Código de invitación:</span>
                <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono text-[11px] font-semibold">
                  {selectedGroup.inviteCode}
                </code>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button asChild size="sm" variant="outline" className="text-xs font-semibold">
                <Link href={`/grupos/${selectedGroup.id}`}>
                  Gestionar Grupo
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold">
                <Link href="/calendario" className="flex items-center gap-1">
                  Pronosticar Partidos
                  <ArrowRight className="size-3" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedGroupId ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2 select-none">
              <Trophy className="size-4 text-accent fill-accent/10" />
              Clasificación de Miembros
            </h2>
          </div>
          <GroupRankingClient groupId={selectedGroupId} currentUserId={currentUserId} />
        </div>
      ) : (
        <p className="text-center py-10 text-muted-foreground">Por favor, selecciona un grupo en el menú superior.</p>
      )}
    </div>
  );
}
