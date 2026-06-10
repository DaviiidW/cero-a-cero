import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { refreshGroupInvite } from "@/lib/groups/service";
import { isInviteActive } from "@/lib/invite-code";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  const { groupId } = await context.params;
  const result = await refreshGroupInvite(user.id, groupId);

  if ("error" in result) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({
    inviteCode: result.inviteCode,
    inviteLink: result.inviteLink,
    inviteExpiresAt: result.inviteExpiresAt.toISOString(),
    inviteActive: isInviteActive(result.inviteExpiresAt),
    message: "Código de invitación actualizado",
  });
}
