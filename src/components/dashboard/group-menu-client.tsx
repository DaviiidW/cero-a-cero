"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGroup } from "@/components/providers/group-provider";
import { Button } from "@/components/ui/button";
import { Users, PlusCircle, ArrowRight } from "lucide-react";
import { DEFAULT_GROUP_IMAGE } from "@/lib/constants/groups";

type GroupMenuClientProps = {
  groups: Array<{
    id: string;
    name: string;
    image: string | null;
  }>;
};

export function GroupMenuClient({ groups }: GroupMenuClientProps) {
  const router = useRouter();
  const { changeGroup } = useGroup();

  function handleSelectGroup(id: string) {
    changeGroup(id);
    router.push("/");
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-10 overflow-x-hidden w-full">
      {/* Animated gradient background */}
      <div className="fixed inset-0 overflow-hidden bg-background z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-primary/30 blur-[80px] sm:blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] rounded-full bg-accent/25 blur-[80px] sm:blur-[120px] animate-blob-reverse" />
        <div className="absolute top-[30%] left-[20%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-secondary/40 blur-[80px] sm:blur-[120px] animate-blob-slow" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md p-6 space-y-6 select-none">

        {/* Logo + title */}
        <div className="flex flex-col items-center justify-center space-y-2 pb-2 border-b border-border/40">
          <Image
            src="/logo_0-0nobg.png"
            alt="Cero a Cero"
            width={80}
            height={24}
            priority
            className="h-8 w-auto opacity-80"
          />
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-muted-foreground">
            Cero a Cero
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Mis Grupos</h1>
          <p className="text-xs text-muted-foreground">
            Elige un grupo para pronosticar partidos y ver la clasificación
          </p>
        </div>

        {/* Groups list */}
        {groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => handleSelectGroup(group.id)}
                className="w-full text-left p-4 rounded-xl border border-border bg-card/50 hover:bg-muted/50 hover:border-primary/40 transition-all duration-200 cursor-pointer flex items-center gap-3 shadow-sm active:scale-[0.98]"
              >
                <Image
                  src={group.image || DEFAULT_GROUP_IMAGE}
                  alt={group.name}
                  width={40}
                  height={40}
                  className="size-10 rounded-lg object-cover shrink-0"
                  unoptimized
                />
                <span className="font-bold text-foreground text-sm truncate flex-1 group-hover:text-primary transition-colors">
                  {group.name}
                </span>
                <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors shrink-0">
                  <span>Entrar</span>
                  <ArrowRight className="size-4" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">
            Aún no perteneces a ningún grupo.
          </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pt-4 border-t border-border/40">
          <Button asChild size="sm" className="w-full text-xs font-bold py-5 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/grupos/nuevo" className="flex items-center gap-1.5 justify-center">
              <PlusCircle className="size-4" />
              Crear Grupo
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full text-xs font-semibold py-5">
            <Link href="/grupos/unirse" className="flex items-center gap-1.5 justify-center">
              <Users className="size-4 text-primary" />
              Unirse a Grupo
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}
