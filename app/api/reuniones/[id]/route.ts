import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const row = await prisma.reunion.update({
    where: { id },
    data: {
      realizada: body.realizada !== undefined ? Boolean(body.realizada) : undefined,
      dealNombre: body.dealNombre !== undefined ? body.dealNombre : undefined,
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.reunion.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
