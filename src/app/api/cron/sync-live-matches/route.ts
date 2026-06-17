import { NextResponse } from "next/server";
import { syncLiveMatchesOnly } from "@/lib/football-data/sync";

/**
 * GET /api/cron/sync-live-matches
 *
 * Endpoint llamado por Vercel Cron Jobs cada minuto durante el torneo.
 * Solo actúa si hay partidos activos en la BD, minimizando llamadas a la API externa.
 *
 * Protegido con Authorization: Bearer <CRON_SECRET>.
 * Vercel Cron Jobs envía este header automáticamente si se configura en vercel.json.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // Validate secret if configured (required in production)
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (token !== cronSecret) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  try {
    const result = await syncLiveMatchesOnly();

    if (result.activeMatchesFound === 0) {
      return NextResponse.json({
        ok: true,
        message: "Sin partidos activos. No se realizó ninguna sincronización.",
        result,
      });
    }

    console.log("[Cron] Live sync completado:", result);

    return NextResponse.json({
      ok: true,
      message: `Sincronizados ${result.matchesSynced} partidos. ${result.finishedMatchesScored} finalizados con scoring.`,
      result,
    });
  } catch (error: unknown) {
    console.error("[Cron] Error en sync-live-matches:", error);
    return NextResponse.json(
      {
        error: "Error interno en la sincronización",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
