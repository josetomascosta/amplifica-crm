import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const row = await prisma.compromisoSemanal.update({
    where: { id },
    data: {
      compromisoReuniones: body.compromisoReuniones !== undefined ? Number(body.compromisoReuniones) : undefined,
      logradoReuniones: body.logradoReuniones !== undefined ? Boolean(body.logradoReuniones) : undefined,
      compromisoPedidos: body.compromisoPedidos !== undefined ? Number(body.compromisoPedidos) : undefined,
      logradoPedidos: body.logradoPedidos !== undefined ? Boolean(body.logradoPedidos) : undefined,
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.compromisoSemanal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
