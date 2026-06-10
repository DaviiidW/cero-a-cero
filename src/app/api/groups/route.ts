import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError, validationError } from "@/lib/api";
import { createGroup, getUserGroups } from "@/lib/groups/service";
import { createGroupSchema } from "@/lib/validations/group";

export async function GET() {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  const groups = await getUserGroups(user.id);
  return NextResponse.json({ groups });
}

export async function POST(request: Request) {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  try {
    const body = await request.json();
    const parsed = createGroupSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { name, image, nick } = parsed.data;
    const group = await createGroup(user.id, {
      name,
      image: image || undefined,
      nick,
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch {
    return jsonError("No se pudo crear el grupo", 500);
  }
}
