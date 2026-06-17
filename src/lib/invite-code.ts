import { randomBytes } from "crypto";
import { INVITE_CODE_LENGTH, INVITE_EXPIRY_DAYS } from "@/lib/constants/groups";
import { db } from "@/lib/db";

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(): string {
  const bytes = randomBytes(INVITE_CODE_LENGTH);
  let code = "";

  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += CHARSET[bytes[i]! % CHARSET.length];
  }

  return code;
}

export async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCode();
    const existing = await db.group.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });

    if (!existing) {
      return code;
    }
  }

  throw new Error("No se pudo generar un código de invitación único");
}

export function normalizeInviteCode(code: string): string {
  return code.trim().toUpperCase();
}

export function getInviteExpiryDate(from = new Date()): Date {
  const expiresAt = new Date(from);
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);
  return expiresAt;
}

export function getInviteLink(inviteCode: string): string {
  let baseUrl = "https://cero-a-cero-hu3u.vercel.app";

  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("localhost")) {
    baseUrl = process.env.NEXTAUTH_URL;
  } else if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    baseUrl = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  } else if (process.env.NEXTAUTH_URL) {
    baseUrl = process.env.NEXTAUTH_URL;
  }

  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${cleanBaseUrl}/unirse/${inviteCode}`;
}

export function isInviteActive(inviteExpiresAt: Date): boolean {
  return inviteExpiresAt > new Date();
}
