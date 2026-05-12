import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const kr = await prisma.keyResult.update({
    where: { id },
    data: {
      titulo: body.titulo,
      actual: body.actual !== undefined ? Number(body.actual) : undefined,
      objetivo: body.objetivo !== undefined ? Number(body.objetivo) : undefined,
      unidad: body.unidad,
    },
  });
  return NextResponse.json(kr);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.keyResult.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
