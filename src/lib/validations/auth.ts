import { z } from "zod";

const passwordSchema = z
  .string()
  .min(4, "La contraseña debe tener al menos 4 caracteres");

const nickSchema = z
  .string()
  .trim()
  .min(3, "El nick debe tener al menos 3 caracteres")
  .max(20, "El nick no puede superar 20 caracteres")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "El nick solo puede contener letras, números y guiones bajos"
  );

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Introduce un correo electrónico válido"),
  nick: nickSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Introduce un correo electrónico válido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Introduce un correo electrónico válido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "El token es obligatorio"),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria"),
  newPassword: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
