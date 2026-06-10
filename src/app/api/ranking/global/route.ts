import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { getGlobalRanking } from "@/lib/scoring/queries";

export async function GET() {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  const ranking = await getGlobalRanking();
  return NextResponse.json({ ranking, updatedAt: new Date().toISOString() });
}
