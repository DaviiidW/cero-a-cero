import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { kickMember } from "@/lib/groups/service";

type RouteContext = {
  params: Promise<{ groupId: string; userId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  const { groupId, userId: targetUserId } = await context.params;
  const result = await kickMember(user.id, groupId, targetUserId);

  if ("error" in result) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({
    message: "Miembro expulsado correctamente",
  });
}
