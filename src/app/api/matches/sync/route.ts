import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/auth-admin";
import { syncMatchesFromFootballData } from "@/lib/football-data/sync";

async function isAuthorizedSync(request: Request): Promise<boolean> {
  // Option 1: Logged in super admin
  const admin = await requireSuperAdmin();
  if (admin) return true;

  // Option 2: Cron secret header
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("x-cron-secret") === cronSecret) {
    return true;
  }

  // Option 3: Local development fallback (only if no secret is defined)
  return process.env.NODE_ENV === "development" && !cronSecret;
}

export async function POST(request: Request) {
  const authorized = await isAuthorizedSync(request);
  if (!authorized) {
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
