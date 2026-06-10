import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { GROUP_ERRORS } from "@/lib/groups/errors";
import { isGroupMember } from "@/lib/groups/service";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ groupId: string; matchId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  const { groupId, matchId } = await context.params;
  const member = await isGroupMember(user.id, groupId);

  if (!member) {
    return jsonError(GROUP_ERRORS.NOT_MEMBER, 403);
  }

  const match = await db.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    return jsonError("Partido no encontrado", 404);
  }

  const prediction = await db.prediction.findUnique({
    where: {
      userId_matchId_groupId: {
        userId: user.id,
        matchId,
        groupId,
      },
    },
  });

  return NextResponse.json({
    match,
    prediction,
  });
}
