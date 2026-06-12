import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-admin";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { recalculateGroupRankings } from "@/lib/scoring/ranking-recalc";

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return jsonError("No autorizado", 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo de solicitud inválido", 400);
  }

  const { groupId } = body;
  if (!groupId) {
    return jsonError("El campo groupId es obligatorio", 400);
  }

  // Verify group exists
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { id: true, name: true },
  });

  if (!group) {
    return jsonError("Grupo no encontrado", 404);
  }

  try {
    const start = Date.now();
    await recalculateGroupRankings([groupId]);
    const duration = Date.now() - start;

    return NextResponse.json({
      success: true,
      message: `Clasificación del grupo "${group.name}" recalculada correctamente en ${duration} ms.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al recalcular la clasificación";
    return jsonError(message, 500);
  }
}
