import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { GROUP_ERRORS } from "@/lib/groups/errors";
import { findGroupByInviteCode } from "@/lib/groups/service";
import { isInviteActive } from "@/lib/invite-code";
import { MAX_GROUP_MEMBERS } from "@/lib/constants/groups";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { code } = await context.params;
  const group = await findGroupByInviteCode(code);

  if (!group) {
    return jsonError(GROUP_ERRORS.INVITE_INVALID, 404);
  }

  if (!isInviteActive(group.inviteExpiresAt)) {
    return jsonError(GROUP_ERRORS.INVITE_EXPIRED, 410);
  }

  if (group._count.members >= MAX_GROUP_MEMBERS) {
    return jsonError(GROUP_ERRORS.MEMBER_LIMIT, 409);
  }

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      image: group.image,
      inviteCode: group.inviteCode,
      memberCount: group._count.members,
      inviteExpiresAt: group.inviteExpiresAt,
    },
  });
}
