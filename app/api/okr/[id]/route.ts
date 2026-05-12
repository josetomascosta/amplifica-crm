import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const okr = await prisma.oKR.update({
    where: { id },
    data: {
      objetivo: body.objetivo,
      descripcion: body.descripcion,
      trimestre: body.trimestre,
      activo: body.activo,
    },
    include: { keyResults: true },
  });
  return NextResponse.json(okr);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.oKR.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
