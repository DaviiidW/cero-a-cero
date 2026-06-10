import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth-session";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Trophy, CheckCircle, ChevronRight } from "lucide-react";

export default async function HomePage() {
  const session = await getSession();

  if (session?.user) {
    return <DashboardClient currentUserId={session.user.id} />;
  }

  // Public Welcome Page (HU-14, HU-16)
  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-card via-background to-background">
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20 text-center space-y-8 relative z-10">
        
        {/* Logo and branding */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <Image
            src="/logo_0-0nobg.png"
            alt="Cero a Cero Logo"
            width={260}
            height={80}
            priority
            className="w-56 sm:w-64 h-auto drop-shadow-xl animate-fade-in"
          />
          <p className="text-xs font-bold uppercase tracking-wider text-accent px-3 py-1 bg-accent/10 rounded-full border border-accent/20 select-none">
            MUNDIAL DE LA FIFA 2026
          </p>
        </div>

        {/* Headline */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            La porra definitiva del mundial de fútbol
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground font-normal max-w-xl mx-auto">
            Crea tu grupo, predice los marcadores de todas las fases del torneo, compite con tus amigos y demuestra quién sabe más de fútbol.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto pt-2">
          <Button asChild size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 shadow-lg shadow-primary/20">
            <Link href="/register" className="flex items-center justify-center gap-2">
              Comenzar ahora
              <ChevronRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto font-semibold px-8">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 text-left max-w-3xl mx-auto border-t border-border/60">
          <div className="space-y-1 bg-card/40 p-4 rounded-xl border border-border/50">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <CheckCircle className="size-4 text-primary shrink-0" />
              Grupos privados
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Crea tu propia liga de predicciones privada usando un código de invitación para jugar solo con tus amigos o compañeros.
            </p>
          </div>
          <div className="space-y-1 bg-card/40 p-4 rounded-xl border border-border/50">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <CheckCircle className="size-4 text-primary shrink-0" />
              Pronósticos en vivo
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Realiza o edita tus predicciones de goles hasta 3 minutos antes del pitido inicial. Revisa los resultados del grupo en tiempo real.
            </p>
          </div>
          <div className="space-y-1 bg-card/40 p-4 rounded-xl border border-border/50">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Trophy className="size-4 text-accent shrink-0" />
              Reglas de puntuación
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Consigue 1 punto por acertar el signo ganador (1X2) y 1 punto adicional por adivinar el marcador exacto de cada partido.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
