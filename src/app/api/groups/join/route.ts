import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError, validationError } from "@/lib/api";
import { joinGroup } from "@/lib/groups/service";
import { joinGroupSchema } from "@/lib/validations/group";

export async function POST(request: Request) {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  try {
    const body = await request.json();
    const parsed = joinGroupSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const result = await joinGroup(user.id, parsed.data.code, parsed.data.nick);

    if ("error" in result) {
      return jsonError(result.error, result.status);
    }

    return NextResponse.json({
      groupId: result.groupId,
      message: "Te has unido al grupo correctamente",
    });
  } catch {
    return jsonError("No se pudo unir al grupo", 500);
  }
}
