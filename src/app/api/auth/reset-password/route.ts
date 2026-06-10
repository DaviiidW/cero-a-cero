import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { hashResetToken } from "@/lib/reset-token";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { jsonError, validationError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { token, password } = parsed.data;
    const tokenHash = hashResetToken(token);

    const resetToken = await db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: { id: true },
        },
      },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt < new Date()
    ) {
      return jsonError("El enlace no es válido o ha expirado", 400);
    }

    const passwordHash = await hashPassword(password);

    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      message: "Contraseña actualizada correctamente",
    });
  } catch {
    return jsonError("No se pudo restablecer la contraseña", 500);
  }
}
