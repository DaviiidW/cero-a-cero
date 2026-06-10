export const GROUP_ERRORS = {
  NOT_FOUND: "Grupo no encontrado",
  INVITE_EXPIRED: "El código de invitación ha caducado",
  INVITE_INVALID: "El código de invitación no es válido",
  MEMBER_LIMIT: "Este grupo ha alcanzado el límite de 50 miembros",
  ALREADY_MEMBER: "Ya perteneces a este grupo",
  NICK_TAKEN: "Este nick ya está en uso en el grupo",
  NOT_MEMBER: "No tienes acceso a este grupo",
  NOT_ADMIN: "Solo el administrador puede realizar esta acción",
  CANNOT_KICK_SELF: "No puedes expulsarte a ti mismo",
  CANNOT_KICK_ADMIN: "No puedes expulsar al administrador",
} as const;
