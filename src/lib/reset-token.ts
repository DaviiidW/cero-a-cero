import { createHash, randomBytes } from "crypto";
import { db } from "@/lib/db";

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export function generateResetToken(): string {
  return randomBytes(RESET_TOKEN_BYTES).toString("hex");
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getResetTokenExpiry(): Date {
  return new Date(Date.now() + RESET_TOKEN_TTL_MS);
}

export async function createPasswordResetToken(userId: string) {
  const token = generateResetToken();
  const tokenHash = hashResetToken(token);

  await db.passwordResetToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: getResetTokenExpiry(),
    },
  });

  return token;
}
