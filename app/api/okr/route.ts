import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const okrs = await prisma.oKR.findMany({
    include: { keyResults: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(okrs);
}

export async function POST(req: Request) {
  const body = await req.json();
  const okr = await prisma.oKR.create({
    data: {
      objetivo: body.objetivo,
      descripcion: body.descripcion || null,
      trimestre: body.trimestre,
      activo: body.activo ?? true,
    },
    include: { keyResults: true },
  });
  return NextResponse.json(okr);
}
