import { z } from "zod";

const groupNickSchema = z
  .string()
  .trim()
  .min(3, "El nick debe tener al menos 3 caracteres")
  .max(20, "El nick no puede superar 20 caracteres")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "El nick solo puede contener letras, números y guiones bajos"
  );

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre no puede superar 50 caracteres"),
  image: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val.startsWith("/") || /^https?:\/\//.test(val),
      "La imagen debe ser una URL válida o una ruta relativa"
    ),
  nick: groupNickSchema,
});

export const joinGroupSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "Introduce un código válido")
    .max(12, "Código no válido"),
  nick: groupNickSchema,
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
