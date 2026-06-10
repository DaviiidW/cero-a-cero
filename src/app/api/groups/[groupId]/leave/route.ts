import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { leaveGroup } from "@/lib/groups/service";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  const { groupId } = await context.params;
  const result = await leaveGroup(user.id, groupId);

  if ("error" in result) {
    return jsonError(result.error, result.status);
  }

  return NextResponse.json({
    message: result.deleted
      ? "Has abandonado el grupo y este ha sido eliminado"
      : "Has abandonado el grupo",
    deleted: result.deleted,
  });
}
