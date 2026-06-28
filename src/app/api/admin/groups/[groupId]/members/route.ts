import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-admin";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return jsonError("No autorizado", 401);
  }

  const { groupId } = await context.params;

  try {
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                nickGlobal: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return jsonError("Grupo no encontrado", 404);
    }

    const members = group.members.map((m) => ({
      userId: m.userId,
      nick: m.nick || m.user.nickGlobal,
    }));

    return NextResponse.json({ ok: true, members });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al cargar miembros";
    return jsonError(message, 500);
  }
}
