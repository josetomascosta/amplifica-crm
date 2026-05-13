const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Each entry: [dealNameSubstring, correctBD, correctEmail]
// These are corrections to wrong assignments
const CORRECTIONS = [
  ["Mundo del Té",       "José Tomás Costa", "josetomas@amplifica.io"],
  ["Bigu Snacks",        "José Tomás Costa", "josetomas@amplifica.io"],
  ["UDLA",               "Manuel del Río",   "manuel@amplifica.io"],
  ["La Japonesa",        "Rubén Quintero",   "ruben@amplifica.io"],
  ["Mundo HBM",          "Rubén Quintero",   "ruben@amplifica.io"],
  ["Big Natural",        "Rubén Quintero",   "ruben@amplifica.io"],
  ["Bio Neutral Pet",    "José Tomás Costa", "josetomas@amplifica.io"],
  ["Artic Snus",         "José Tomás Costa", "josetomas@amplifica.io"],
  ["Tu Aventura Secreta","José Tomás Costa", "josetomas@amplifica.io"],
];

async function main() {
  for (const [name, bdNombre, email] of CORRECTIONS) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { console.log(`✗ Usuario no encontrado: ${email}`); continue; }

    // Find exact match first, then fallback to contains
    let deal = await prisma.deal.findFirst({ where: { nombre: name } });
    if (!deal) {
      deal = await prisma.deal.findFirst({ where: { nombre: { contains: name, mode: "insensitive" } } });
    }

    if (deal) {
      await prisma.deal.update({
        where: { id: deal.id },
        data: { businessDeveloper: bdNombre, propietarioId: user.id },
      });
      console.log(`✓ ${deal.nombre} → ${bdNombre}`);
    } else {
      console.log(`✗ Deal no encontrado: "${name}"`);
    }
  }

  // Summary
  console.log("\n=== RESUMEN FINAL ===");
  const total = await prisma.deal.count();
  const asignados = await prisma.deal.count({ where: { businessDeveloper: { not: null } } });
  const sinBD = await prisma.deal.findMany({ where: { businessDeveloper: null }, select: { nombre: true } });
  console.log(`Total deals: ${total} | Con BD: ${asignados} | Sin asignar: ${sinBD.length}`);
  if (sinBD.length) sinBD.forEach(d => console.log(`  - ${d.nombre}`));

  console.log("\n=== DEALS POR BD ===");
  for (const bd of ["José Tomás Costa", "Manuel del Río", "Rubén Quintero"]) {
    const deals = await prisma.deal.findMany({ where: { businessDeveloper: bd }, select: { nombre: true } });
    console.log(`\n${bd} (${deals.length}):`);
    deals.forEach(d => console.log(`  - ${d.nombre}`));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
