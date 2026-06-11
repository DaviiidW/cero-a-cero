import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth-admin";
import { jsonError } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET() {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return jsonError("No autorizado", 401);
  }

  let result = await db.tournamentResult.findUnique({
    where: { id: "singleton" },
  });

  if (!result) {
    result = {
      id: "singleton",
      champion: null,
      runnerUp: null,
      thirdPlace: null,
    };
  }

  return NextResponse.json({ result });
}

export async function POST(request: Request) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    return jsonError("No autorizado", 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Cuerpo de solicitud inválido", 400);
  }

  const { champion, runnerUp, thirdPlace } = body;

  const result = await db.tournamentResult.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      champion: champion || null,
      runnerUp: runnerUp || null,
      thirdPlace: thirdPlace || null,
    },
    update: {
      champion: champion || null,
      runnerUp: runnerUp || null,
      thirdPlace: thirdPlace || null,
    },
  });

  return NextResponse.json({
    result,
    message: "Resultados reales del torneo guardados correctamente",
  });
}
