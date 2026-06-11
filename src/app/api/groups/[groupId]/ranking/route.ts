import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { GROUP_ERRORS } from "@/lib/groups/errors";
import { isGroupMember } from "@/lib/groups/service";
import { getGroupRanking } from "@/lib/scoring/queries";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ groupId: string }>;
};

function parseJornadaParam(param: string | null): number | number[] | undefined {
  if (!param || param === "total") {
    return undefined;
  }
  if (param.includes(",")) {
    const list = param.split(",").map(n => parseInt(n, 10)).filter(n => !isNaN(n));
    return list.length > 0 ? list : undefined;
  }
  const single = parseInt(param, 10);
  return isNaN(single) ? undefined : single;
}

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

  const url = new URL(_request.url);
  const jornadaParam = url.searchParams.get("jornada");
  const mappedJornada = parseJornadaParam(jornadaParam);

  const ranking = await getGroupRanking(groupId, mappedJornada);

  // Fetch matchdays with at least one finished match
  const finishedMatches = await db.match.findMany({
    where: {
      status: "FINISHED",
    },
    select: {
      jornada: true,
    },
    distinct: ["jornada"],
  });
  const availableJornadas = finishedMatches.map(m => m.jornada);

  return NextResponse.json({
    ranking: ranking.rows,
    availableJornadas,
    updatedAt: ranking.updatedAt?.toISOString() ?? null,
  });
}
