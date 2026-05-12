import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const kr = await prisma.keyResult.create({
    data: {
      okrId: params.id,
      titulo: body.titulo,
      objetivo: Number(body.objetivo),
      actual: Number(body.actual ?? 0),
      unidad: body.unidad || "unidades",
    },
  });
  return NextResponse.json(kr);
}
