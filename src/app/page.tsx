import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth-session";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, CheckCircle, ChevronRight } from "lucide-react";
import { Anton } from "next/font/google";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
});

export default async function HomePage() {
  const session = await getSession();

  if (session?.user) {
    return <DashboardClient currentUserId={session.user.id} />;
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center overflow-x-hidden">
      {/* Fixed background image viewport-locked to look perfect on mobile and prevent stretching */}
      <div 
        className="fixed inset-0 bg-cover bg-[position:center_75%] bg-no-repeat z-0"
        style={{ backgroundImage: "url('/seleccion_espanola.jpg')" }}
      />
      {/* Dark tone overlay with even lower opacity for maximum image clarity */}
      <div className="fixed inset-0 bg-gradient-to-b from-background/15 via-background/45 to-background z-0" />
      
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20 text-center space-y-8 relative z-10 w-full">
        
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
          <Badge variant="gold" className="text-[10px] tracking-wider uppercase px-3 py-1 font-bold">
            Mundial de la FIFA 2026
          </Badge>
        </div>

        {/* Headline / Title in the style of the reference image */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <h1 
            className={`${anton.className} text-6xl sm:text-8xl tracking-tight uppercase leading-none select-none drop-shadow-lg`}
            style={{
              color: "#ffffff",
              textShadow: "4px 4px 0px var(--accent), 8px 8px 0px rgba(0, 0, 0, 0.9)",
            }}
          >
            Cero a Cero
          </h1>
          <p className="text-lg sm:text-xl text-stone-200 font-semibold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            La porra definitiva del mundial de fútbol
          </p>
          <p className="text-sm sm:text-base text-stone-300 font-normal max-w-xl mx-auto leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            Crea tu grupo, predice los marcadores de todas las fases del torneo, compite con tus amigos y demuestra quién sabe más de fútbol.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto pt-4 relative z-10">
          <Button asChild size="lg" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-105 active:scale-95 transition-all font-extrabold px-10 py-6 text-lg rounded-xl shadow-xl shadow-accent/25 border-none">
            <Link href="/login" className="flex items-center justify-center gap-2">
              ¡Juega ahora!
              <ChevronRight className="size-5" />
            </Link>
          </Button>
        </div>

        {/* Features grid with glassmorphic cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 text-left max-w-3xl mx-auto border-t border-border/40">
          <Card className="bg-card/70 backdrop-blur-md border-border/40 shadow-xl">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle className="size-4 text-primary shrink-0" />
                Grupos privados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                Crea tu propia liga de predicciones privada usando un código de invitación para jugar solo con tus amigos o compañeros.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-md border-border/40 shadow-xl">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <CheckCircle className="size-4 text-primary shrink-0" />
                Pronósticos en vivo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                Realiza o edita tus predicciones de goles hasta 3 minutos antes del pitido inicial. Revisa los resultados del grupo en tiempo real.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-md border-border/40 shadow-xl">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2 text-accent">
                <Trophy className="size-4 text-accent shrink-0" />
                Reglas de puntuación
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                Consigue 1 punto por acertar el signo ganador (1X2) y 1 punto adicional por adivinar el marcador exacto de cada partido.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
