import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-admin";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return jsonError("No autorizado", 401);
  }

  try {
    const groups = await db.group.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ ok: true, groups });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al cargar grupos";
    return jsonError(message, 500);
  }
}
