import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";
import { z } from "zod";
import { DEFAULT_GROUP_IMAGE } from "@/lib/constants/groups";

const schema = z.object({
  image: z.string(),
});

type RouteParams = { params: Promise<{ groupId: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const user = await requireAuthUser();
  if (!user) return jsonError("No autorizado", 401);

  const { groupId } = await params;

  // Only the group admin can change the image
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { adminId: true },
  });

  if (!group) return jsonError("Grupo no encontrado", 404);
  if (group.adminId !== user.id) return jsonError("Solo el admin puede editar la foto", 403);

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Datos inválidos", 400);

  // Empty string → restore default image
  const newImage = parsed.data.image.trim() || DEFAULT_GROUP_IMAGE;

  const updated = await db.group.update({
    where: { id: groupId },
    data: { image: newImage },
    select: { image: true },
  });

  return NextResponse.json({ image: updated.image });
}
