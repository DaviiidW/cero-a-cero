import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { syncMatchesFromFootballData } from "@/lib/football-data/sync";

function isAuthorizedSync(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    return request.headers.get("x-cron-secret") === cronSecret;
  }

  return process.env.NODE_ENV === "development";
}

export async function POST(request: Request) {
  if (!isAuthorizedSync(request)) {
    return jsonError("No autorizado", 401);
  }

  try {
    const result = await syncMatchesFromFootballData();
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al sincronizar partidos";
    return jsonError(message, 500);
  }
}
