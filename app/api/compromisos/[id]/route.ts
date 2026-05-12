import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const row = await prisma.compromisoSemanal.update({
    where: { id },
    data: {
      completado: body.completado !== undefined ? Boolean(body.completado) : undefined,
      resultado: body.resultado !== undefined ? body.resultado : undefined,
      texto: body.texto !== undefined ? body.texto : undefined,
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.compromisoSemanal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
