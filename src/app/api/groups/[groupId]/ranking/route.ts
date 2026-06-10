import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { GROUP_ERRORS } from "@/lib/groups/errors";
import { isGroupMember } from "@/lib/groups/service";
import { getGroupRanking } from "@/lib/scoring/queries";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  const { groupId } = await context.params;
  const member = await isGroupMember(user.id, groupId);

  if (!member) {
    return jsonError(GROUP_ERRORS.NOT_MEMBER, 403);
  }

  const ranking = await getGroupRanking(groupId);
  return NextResponse.json({ ranking, updatedAt: new Date().toISOString() });
}
