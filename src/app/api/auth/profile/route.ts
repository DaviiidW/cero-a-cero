import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";

export async function DELETE() {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  try {
    await db.$transaction(async (tx) => {
      // 1. Find all groups where the user is admin
      const adminGroups = await tx.group.findMany({
        where: { adminId: user.id },
        select: { id: true },
      });

      const groupIds = adminGroups.map((g) => g.id);

      if (groupIds.length > 0) {
        // Delete all groups administered by the user (cascades memberships, predictions, and points)
        await tx.group.deleteMany({
          where: { id: { in: groupIds } },
        });
      }

      // 2. Delete the user (cascades other memberships, predictions, points, etc.)
      await tx.user.delete({
        where: { id: user.id },
      });
    });

    return NextResponse.json({ message: "Cuenta eliminada correctamente" });
  } catch (error: unknown) {
    console.error("Error deleting user account:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return jsonError(message, 500);
  }
}

export async function PUT(request: Request) {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  try {
    const body = await request.json();
    const { avatar } = body;

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        avatar: avatar !== undefined ? avatar : undefined,
      },
      select: {
        id: true,
        email: true,
        nickGlobal: true,
        avatar: true,
      }
    });

    return NextResponse.json({ user: updated, message: "Perfil actualizado correctamente" });
  } catch (error: unknown) {
    console.error("Error updating user profile:", error);
    const message = error instanceof Error ? error.message : "Error interno del servidor";
    return jsonError(message, 500);
  }
}
