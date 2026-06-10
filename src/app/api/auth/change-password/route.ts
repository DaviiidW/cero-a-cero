import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { changePasswordSchema } from "@/lib/validations/auth";
import { jsonError, validationError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return jsonError("No autorizado", 401);
    }

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });

    if (!user) {
      return jsonError("No autorizado", 401);
    }

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return jsonError("La contraseña actual no es correcta", 400);
    }

    const passwordHash = await hashPassword(newPassword);

    await db.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      message: "Contraseña actualizada correctamente",
    });
  } catch {
    return jsonError("No se pudo actualizar la contraseña", 500);
  }
}
