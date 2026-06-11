import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { formatResultType } from "@/lib/scoring/labels";
import { Trophy, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function OtroPerfilPage({ params }: PageProps) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const { userId: targetUserId } = await params;

  // If the user is trying to view their own profile, redirect them to their profile page
  if (targetUserId === session.user.id) {
    redirect("/perfil");
  }

  // 1. Get groups the current viewer belongs to
  const viewerMemberships = await db.member.findMany({
    where: { userId: session.user.id },
    select: { groupId: true },
  });
  const viewerGroupIds = viewerMemberships.map((m) => m.groupId);

  // 2. Get groups the target user belongs to
  const targetMemberships = await db.member.findMany({
    where: { userId: targetUserId },
    select: { groupId: true, nick: true, group: { select: { name: true } } },
  });
  const targetGroupIds = targetMemberships.map((m) => m.groupId);

  // 3. Find intersection (shared groups)
  const sharedGroupIds = viewerGroupIds.filter((id) => targetGroupIds.includes(id));

  // If no shared groups exist, access is unauthorized
  if (sharedGroupIds.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
        <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <Shield className="size-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-foreground">Acceso no autorizado</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Solo puedes consultar el perfil de usuarios con los que compartas al menos un grupo de predicciones.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/">Volver a la clasificación</Link>
        </Button>
      </div>
    );
  }

  // 4. Fetch target user information
  const targetUser = await db.user.findUnique({
    where: { id: targetUserId },
    select: {
      nickGlobal: true,
      avatar: true,
    },
  });

  if (!targetUser) {
    notFound();
  }

  // Get primary nick in the shared groups (default to nickGlobal)
  const primaryNick = targetMemberships.find((m) => sharedGroupIds.includes(m.groupId))?.nick || targetUser.nickGlobal;

  // 5. Fetch predictions from shared groups for matches that are LIVE or FINISHED (HU-09)
  const predictions = await db.prediction.findMany({
    where: {
      userId: targetUserId,
      groupId: { in: sharedGroupIds },
      match: {
        status: { in: ["LIVE", "FINISHED"] },
      },
    },
    include: {
      match: true,
      group: true,
    },
    orderBy: {
      match: {
        date: "desc",
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* Back link */}
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2.5 text-xs text-muted-foreground select-none">
          <Link href="/" className="flex items-center gap-1">
            <ArrowLeft className="size-3.5" />
            Volver a clasificación
          </Link>
        </Button>
      </div>

      {/* Profile Header */}
      <div className="bg-card p-6 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row items-center gap-5">
        <div className="size-20 rounded-2xl bg-muted border border-border flex items-center justify-center text-4xl shadow-inner select-none">
          {targetUser.avatar || "⚽"}
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{primaryNick}</h1>
          <p className="text-xs text-muted-foreground">
            Alias global: @{targetUser.nickGlobal}
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 pt-1">
            {targetMemberships
              .filter((m) => sharedGroupIds.includes(m.groupId))
              .map((m) => (
                <span
                  key={m.groupId}
                  className="inline-block text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 select-none"
                >
                  {m.group.name}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Predictions list */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2 select-none">
          <Trophy className="size-4 text-accent" />
          Pronósticos Públicos ({predictions.length})
        </h2>
        
        {predictions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground text-xs italic">
            Este usuario aún no tiene predicciones de partidos en juego o finalizados en vuestros grupos compartidos.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {predictions.map((pred) => {
              const isLive = pred.match.status === "LIVE";
              const isFinished = pred.match.status === "FINISHED";
              const points = pred.pointsEarned;

              return (
                <li
                  key={pred.id}
                  className={`p-4 rounded-2xl border bg-card transition-all duration-200 ${
                    isLive
                      ? "border-red-500/30"
                      : points && points > 0
                        ? "border-primary/30"
                        : "border-border/60"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Teams */}
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-bold text-foreground">
                        {pred.match.homeTeamCrest && (
                          <img
                            src={pred.match.homeTeamCrest}
                            alt=""
                            className="inline-block h-3.5 w-5 object-cover rounded-sm border border-muted/50"
                          />
                        )}
                        <span>{pred.match.homeTeam}</span>
                        <span className="text-muted-foreground font-normal text-xs select-none">vs</span>
                        {pred.match.awayTeamCrest && (
                          <img
                            src={pred.match.awayTeamCrest}
                            alt=""
                            className="inline-block h-3.5 w-5 object-cover rounded-sm border border-muted/50"
                          />
                        )}
                        <span>{pred.match.awayTeam}</span>
                      </div>

                      {/* Meta information */}
                      <p className="text-[10px] text-muted-foreground font-medium">
                        <span className="text-accent font-semibold">{pred.match.phase}</span>
                        {" · "}
                        <span className="text-primary font-bold">{pred.group.name}</span>
                      </p>

                      {/* Prediction and score details */}
                      <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-2 text-[11px] font-semibold">
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground text-[10px] font-medium block">Predicción</span>
                          <span className="text-foreground">
                            {pred.predictionHomeGoals} - {pred.predictionAwayGoals}{" "}
                            <span className="text-[9px] font-bold text-accent uppercase tracking-wider px-1 bg-accent/10 rounded border border-accent/20 select-none">
                              {formatResultType(pred.resultType)}
                            </span>
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-muted-foreground text-[10px] font-medium block">Marcador Real</span>
                          <span className="text-foreground font-bold">
                            {pred.match.status === "LIVE" || pred.match.status === "FINISHED" || (pred.match.status === "SCHEDULED" && new Date() >= new Date(pred.match.date))
                              ? `${pred.match.homeGoals ?? 0} - ${pred.match.awayGoals ?? 0}`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Points indicator */}
                    <div className="text-right shrink-0 select-none">
                      {isFinished ? (
                        <div className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-16 border ${
                          points && points > 0
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}>
                          <span className="text-xl font-black leading-none">+{points ?? 0}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">puntos</span>
                        </div>
                      ) : (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg animate-pulse">
                          En juego
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
