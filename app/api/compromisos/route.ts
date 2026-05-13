import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const semana = searchParams.get("semana");
  const rows = await prisma.compromisoSemanal.findMany({
    where: semana ? { semana } : undefined,
    orderBy: [{ semana: "desc" }, { bdNombre: "asc" }],
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const row = await prisma.compromisoSemanal.upsert({
    where: { semana_bdNombre: { semana: body.semana, bdNombre: body.bdNombre } },
    update: {
      compromisoReuniones: body.compromisoReuniones !== undefined ? Number(body.compromisoReuniones) : undefined,
      logradoReuniones: body.logradoReuniones !== undefined ? Boolean(body.logradoReuniones) : undefined,
      compromisoPedidos: body.compromisoPedidos !== undefined ? Number(body.compromisoPedidos) : undefined,
      logradoPedidos: body.logradoPedidos !== undefined ? Boolean(body.logradoPedidos) : undefined,
    },
    create: {
      semana: body.semana,
      bdNombre: body.bdNombre,
      compromisoReuniones: Number(body.compromisoReuniones) || 0,
      logradoReuniones: Boolean(body.logradoReuniones),
      compromisoPedidos: Number(body.compromisoPedidos) || 0,
      logradoPedidos: Boolean(body.logradoPedidos),
    },
  });
  return NextResponse.json(row);
}
