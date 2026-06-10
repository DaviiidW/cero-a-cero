import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-session";
import { GROUP_ERRORS } from "@/lib/groups/errors";
import { requireGroupMember } from "@/lib/groups/service";

export async function requireAuthenticatedUser() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user;
}

export async function requireGroupAccess(userId: string, groupId: string) {
  const membership = await requireGroupMember(userId, groupId);

  if (!membership) {
    redirect("/grupos?error=" + encodeURIComponent(GROUP_ERRORS.NOT_MEMBER));
  }

  return membership;
}
