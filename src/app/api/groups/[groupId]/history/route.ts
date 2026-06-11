import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { GROUP_ERRORS } from "@/lib/groups/errors";
import { isGroupMember } from "@/lib/groups/service";
import { getUserGroupHistory } from "@/lib/scoring/queries";

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

  const history = await getUserGroupHistory(user.id, groupId);

  return NextResponse.json({
    history: history.map((item) => ({
      id: item.id,
      matchId: item.matchId,
      predictionHomeGoals: item.predictionHomeGoals,
      predictionAwayGoals: item.predictionAwayGoals,
      resultType: item.resultType,
      pointsEarned: item.pointsEarned,
      match: item.match,
    })),
    updatedAt: new Date().toISOString(),
  });
}
