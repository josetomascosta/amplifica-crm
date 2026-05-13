const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("Amplifica2026", 10);

  // Create Rubén's account
  const ruben = await prisma.user.upsert({
    where: { email: "ruben@amplifica.io" },
    update: {},
    create: {
      name: "Rubén Quintero",
      email: "ruben@amplifica.io",
      role: "SALES",
      passwordHash: hash,
      activo: true,
    },
  });
  console.log(`✓ Rubén listo (id: ${ruben.id})`);

  // Deals that belong to Rubén
  const DEALS_RUBEN = [
    "Rebel", "Viña Santa Ester", "Mundo HBM", "Tita Bianchi", "La Japonesa",
    "Honeycomb", "Aura May", "Santa Gota", "Big Natural", "Kanka",
  ];

  // Fix JT's wrongly-assigned deals
  const FIX_FROM_JT = ["Mundo HBM", "Big Natural"];
  console.log("\n=== CORRIGIENDO ASIGNACIONES ERRÓNEAS ===");
  for (const nombre of FIX_FROM_JT) {
    const found = await prisma.deal.findFirst({
      where: { nombre: { contains: nombre.split(" ")[0], mode: "insensitive" }, businessDeveloper: "José Tomás Costa" },
    });
    if (found) {
      await prisma.deal.update({
        where: { id: found.id },
        data: { businessDeveloper: "Rubén Quintero", propietarioId: ruben.id },
      });
      console.log(`  ✓ Corregido: ${found.nombre} → Rubén Quintero`);
    }
  }

  // Fix Nutribiota — ensure it only belongs to Manuel
  const nutribiota = await prisma.deal.findFirst({
    where: { nombre: { contains: "Nutri", mode: "insensitive" }, businessDeveloper: "José Tomás Costa" },
  });
  if (nutribiota) {
    const manuelUser = await prisma.user.findUnique({ where: { email: "manuel@amplifica.io" } });
    await prisma.deal.update({
      where: { id: nutribiota.id },
      data: { businessDeveloper: "Manuel del Río", propietarioId: manuelUser?.id ?? null },
    });
    console.log(`  ✓ Nutribiota corregido → Manuel del Río`);
  }

  // Assign all Rubén's deals
  console.log("\n=== ASIGNANDO DEALS A RUBÉN ===");
  for (const nombre of DEALS_RUBEN) {
    const deals = await prisma.deal.findMany({
      where: { nombre: { contains: nombre.split(" ")[0], mode: "insensitive" } },
    });
    const match = deals.find((d) =>
      d.nombre.toLowerCase().replace(/[^a-záéíóúñü ]/g, "").includes(
        nombre.toLowerCase().replace(/[^a-záéíóúñü ]/g, "").split(" ")[0]
      )
    );
    if (match) {
      await prisma.deal.update({
        where: { id: match.id },
        data: { businessDeveloper: "Rubén Quintero", propietarioId: ruben.id },
      });
      console.log(`  ✓ ${match.nombre} → Rubén Quintero`);
    } else {
      console.log(`  ✗ No encontrado: "${nombre}"`);
    }
  }

  // Summary
  console.log("\n=== RESUMEN FINAL ===");
  const total = await prisma.deal.count();
  const asignados = await prisma.deal.count({ where: { businessDeveloper: { not: null } } });
  const sinBD = await prisma.deal.findMany({ where: { businessDeveloper: null }, select: { nombre: true } });
  console.log(`Total deals: ${total}`);
  console.log(`Con BD asignado: ${asignados}`);
  if (sinBD.length) {
    console.log(`Sin asignar (${sinBD.length}):`);
    sinBD.forEach((d) => console.log(`  - ${d.nombre}`));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
