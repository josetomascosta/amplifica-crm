import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine") === "true";

  const deals = await prisma.deal.findMany({
    where: mine ? { propietarioId: session.user.id } : undefined,
    include: {
      propietario: { select: { id: true, name: true, image: true, email: true } },
      contactos: true,
      actividades: { orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(deals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const deal = await prisma.deal.create({
    data: {
      nombre: body.nombre,
      etapa: body.etapa || "Cliente potencial",
      propietarioId: body.propietarioId || session.user.id,
      monto: body.monto ? Number(body.monto) : null,
      perfilCliente: body.perfilCliente || null,
      categoriasSeller: body.categoriasSeller || null,
      fuenteContacto: body.fuenteContacto || null,
      clasificacionLead: body.clasificacionLead || null,
      pedidosMensuales: body.pedidosMensuales ? Number(body.pedidosMensuales) : null,
      ecommerce: body.ecommerce || null,
    },
    include: {
      propietario: { select: { id: true, name: true, image: true, email: true } },
      contactos: true,
      actividades: true,
    },
  });

  // Log activity
  await prisma.actividad.create({
    data: {
      tipo: "SISTEMA",
      titulo: "Deal creado",
      dealId: deal.id,
      autorId: session.user.id,
    },
  });

  return NextResponse.json(deal, { status: 201 });
}
