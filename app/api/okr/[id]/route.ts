import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const okr = await prisma.oKR.update({
    where: { id: params.id },
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

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await prisma.oKR.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
