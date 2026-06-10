import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function validationError(error: ZodError) {
  const message = error.issues[0]?.message ?? "Datos no válidos";
  return jsonError(message, 400);
}

export const INVALID_CREDENTIALS_MESSAGE =
  "Correo o contraseña incorrectos";

export const GENERIC_RESET_MESSAGE =
  "Si el correo existe, recibirás un enlace para restablecer tu contraseña (comprueba la carpeta de spam).";
