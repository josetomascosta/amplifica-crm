import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const semana = searchParams.get("semana");
  const rows = await prisma.reunionSemanal.findMany({
    where: semana ? { semana } : undefined,
    orderBy: [{ semana: "desc" }, { bdNombre: "asc" }],
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const row = await prisma.reunionSemanal.upsert({
    where: { semana_bdNombre: { semana: body.semana, bdNombre: body.bdNombre } },
    update: { cantidad: Number(body.cantidad) },
    create: { semana: body.semana, bdNombre: body.bdNombre, cantidad: Number(body.cantidad) },
  });
  return NextResponse.json(row);
}
