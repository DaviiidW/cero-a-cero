import { NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth-api";
import { jsonError } from "@/lib/api";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  const user = await requireAuthUser();
  if (!user) {
    return jsonError("No autorizado", 401);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file || file.size === 0) {
      return jsonError("No se ha enviado ninguna imagen", 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonError("Formato no permitido. Usa JPG, PNG, WEBP o GIF.", 400);
    }

    if (file.size > MAX_SIZE_BYTES) {
      return jsonError("La imagen no puede superar los 5 MB.", 400);
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadDir = join(process.cwd(), "public", "groups");
    await writeFile(join(uploadDir, filename), buffer);

    const imageUrl = `/groups/${filename}`;
    return NextResponse.json({ imageUrl }, { status: 201 });
  } catch (err) {
    console.error("[upload-image]", err);
    return jsonError("Error al subir la imagen", 500);
  }
}
