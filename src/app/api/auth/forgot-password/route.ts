import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/reset-token";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { GENERIC_RESET_MESSAGE, jsonError, validationError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { email } = parsed.data;
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (user) {
      const token = await createPasswordResetToken(user.id);
      const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${token}`;

      await sendPasswordResetEmail(user.email, resetUrl);
    }

    return NextResponse.json({ message: GENERIC_RESET_MESSAGE });
  } catch {
    return jsonError("No se pudo procesar la solicitud", 500);
  }
}
