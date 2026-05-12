import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes") || new Date().toISOString().slice(0, 7); // "2026-05"

  const [year, month] = mes.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const deals = await prisma.deal.findMany({
    select: { etapa: true, businessDeveloper: true, fechaReunion: true, updatedAt: true, fechaCierre: true },
  });

  // Cierres del mes: deals en Cierre Ganado actualizados este mes
  const cierres = deals.filter((d) => {
    if (d.etapa !== "Cierre Ganado") return false;
    const fecha = d.fechaCierre || d.updatedAt;
    return fecha >= start && fecha < end;
  });

  // Reuniones del mes: deals con fechaReunion este mes
  const reuniones = deals.filter((d) => {
    if (!d.fechaReunion) return false;
    return d.fechaReunion >= start && d.fechaReunion < end;
  });

  // Group by BD
  const byBD: Record<string, { cierres: number; reuniones: number }> = {};

  const addBD = (bd: string | null, tipo: "cierres" | "reuniones") => {
    const key = bd || "Sin asignar";
    if (!byBD[key]) byBD[key] = { cierres: 0, reuniones: 0 };
    byBD[key][tipo]++;
  };

  cierres.forEach((d) => addBD(d.businessDeveloper, "cierres"));
  reuniones.forEach((d) => addBD(d.businessDeveloper, "reuniones"));

  return NextResponse.json({
    mes,
    equipo: {
      cierres: cierres.length,
      reuniones: reuniones.length,
    },
    porBD: byBD,
  });
}
