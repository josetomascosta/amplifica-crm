import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes");
  const metas = await prisma.metaMensual.findMany({
    where: mes ? { mes } : undefined,
    orderBy: [{ mes: "desc" }, { assignee: "asc" }],
  });
  return NextResponse.json(metas);
}

export async function POST(req: Request) {
  const body = await req.json();
  const meta = await prisma.metaMensual.upsert({
    where: { mes_tipo_assignee: { mes: body.mes, tipo: body.tipo, assignee: body.assignee } },
    update: { objetivo: Number(body.objetivo) },
    create: {
      mes: body.mes,
      tipo: body.tipo,
      assignee: body.assignee,
      objetivo: Number(body.objetivo),
    },
  });
  return NextResponse.json(meta);
}

export async function DELETE(req: Request) {
  const body = await req.json();
  await prisma.metaMensual.deleteMany({
    where: { mes: body.mes, tipo: body.tipo, assignee: body.assignee },
  });
  return NextResponse.json({ ok: true });
}
