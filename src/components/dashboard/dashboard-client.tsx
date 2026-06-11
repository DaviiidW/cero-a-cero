"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
  const router = useRouter();
  const { selectedGroupId, selectedGroup, isLoadingGroups } = useGroup();

  // If loading, show spinner
  if (isLoadingGroups) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Cargando clasificación y grupos...</p>
      </div>
    );
  }

  // No group selected → redirect to menu (creates a proper history entry)
  // useEffect avoids calling router during render
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!isLoadingGroups && !selectedGroupId) {
      router.replace("/grupos");
    }
  }, [isLoadingGroups, selectedGroupId, router]);

  if (!selectedGroupId) {
    // Render nothing while redirecting
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground animate-pulse">Redirigiendo al menú...</p>
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
