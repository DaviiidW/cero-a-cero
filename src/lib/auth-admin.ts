import { requireAuthUser } from "@/lib/auth-api";

export async function requireSuperAdmin() {
  const user = await requireAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return null;
  }
  return user;
}
