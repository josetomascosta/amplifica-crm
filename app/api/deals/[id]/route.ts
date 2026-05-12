import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: {
      propietario: { select: { id: true, name: true, image: true, email: true } },
      contactos: true,
      actividades: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deal);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const allowed = [
    "nombre", "etapa", "propietarioId", "monto", "probabilidad", "fechaCierre",
    "perfilCliente", "categoriasSeller", "fuenteContacto", "clasificacionLead",
    "pedidosMensuales", "ticketPromedio", "ecommerce", "appsDelivery",
    "canalesActivos", "tipoPlan", "modeloCobro", "cobroPorServicio",
    "tarifaPorPedido", "sucursales", "boost", "fechaReunion", "fechaOnboarding",
    "fechaEnvioContrato", "businessDeveloper", "validadoPorTi", "razonSocial",
    "banco", "resumenMarca", "notasExcepciones",
  ] as const;

  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const deal = await prisma.deal.update({
    where: { id: params.id },
    data,
    include: {
      propietario: { select: { id: true, name: true, image: true, email: true } },
      contactos: true,
      actividades: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  return NextResponse.json(deal);
}
