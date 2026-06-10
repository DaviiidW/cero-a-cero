import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validations/auth";
import { jsonError, validationError } from "@/lib/api";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { email, nick, password } = parsed.data;

    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email }, { nickGlobal: nick }],
      },
      select: { email: true, nickGlobal: true },
    });

    if (existingUser?.email === email) {
      return jsonError("Este correo ya está registrado", 409);
    }

    if (existingUser?.nickGlobal === nick) {
      return jsonError("Este nick ya está en uso", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        email,
        nickGlobal: nick,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        nickGlobal: true,
      },
    });

    return NextResponse.json(
      {
        user,
        message: "Cuenta creada correctamente",
      },
      { status: 201 }
    );
  } catch {
    return jsonError("No se pudo completar el registro", 500);
  }
}
