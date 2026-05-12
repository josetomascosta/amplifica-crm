import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PIPELINE_STAGES } from "@/lib/pipeline";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { etapa } = await req.json();

  const validStage = PIPELINE_STAGES.find((s) => s.id === etapa);
  if (!validStage) {
    return NextResponse.json({ error: "Etapa inválida" }, { status: 400 });
  }

  const deal = await prisma.deal.update({
    where: { id: params.id },
    data: {
      etapa,
      probabilidad: validStage.probability ?? undefined,
    },
    include: {
      propietario: { select: { id: true, name: true, image: true, email: true } },
      contactos: true,
    },
  });

  // Immutable activity log
  await prisma.actividad.create({
    data: {
      tipo: "SISTEMA",
      titulo: `Etapa cambiada a "${etapa}"`,
      dealId: deal.id,
      autorId: session.user.id,
    },
  });

  return NextResponse.json(deal);
}
