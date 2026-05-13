import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bd = searchParams.get("bd");
  const rows = await prisma.reunion.findMany({
    where: bd ? { bdNombre: bd } : undefined,
    orderBy: { fecha: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const row = await prisma.reunion.create({
    data: {
      fecha: new Date(body.fecha),
      bdNombre: body.bdNombre,
      dealNombre: body.dealNombre || null,
      realizada: false,
    },
  });
  return NextResponse.json(row, { status: 201 });
}
