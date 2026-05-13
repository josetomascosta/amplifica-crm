const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

// BD name in deals → user email mapping
const BD_EMAIL_MAP = {
  "Rubén Quintero":   "ruben@amplifica.io",
  "José Tomás Costa": "josetomas@amplifica.io",
  "Manuel del Río":   "manuel@amplifica.io",
};

// Deals per BD (from Excel analysis)
const DEALS_JT = [
  "Divergente", "Implicit", "Mundo del Té", "Omna", "Enila",
  "Artic Snus", "Tu Aventura Secreta", "By Fiori", "Ok Lab Company",
  "María Larraín Joyas", "Lumisse", "Tiffosi", "Bio Neutral Pet",
  "Niboo", "EarProtect", "Funfungi", "Sublend",
  "Bigu Snacks", "Naturel Organic", "Dos Vientos",
];
const DEALS_MANUEL = [
  "Nushop", "Monak", "Utopiaflora", "New Pharma", "Arafem",
  "LatamHair", "Kantha", "PetMyPet", "Nutribiota", "UDLA", "Bienestar Animal",
];
const DEALS_RUBEN = [
  "Rebel", "Viña Santa Ester", "Mundo HBM", "Tita Bianchi", "La Japonesa",
  "Honeycomb", "Aura May", "Santa Gota", "Big Natural", "Kanka",
];

async function main() {
  const DEFAULT_PW = "Amplifica2026";
  const hash = await bcrypt.hash(DEFAULT_PW, 10);

  const users = [
    { name: "José Tomás Costa", email: "josetomas@amplifica.io", role: "SALES", titulo: "Business Developer" },
    { name: "Manuel del Río",   email: "manuel@amplifica.io",    role: "SALES", titulo: "Business Developer" },
    { name: "Felipe Aburto",    email: "faburto@amplifica.io",   role: "SDR",   titulo: "SDR" },
    { name: "Felipe Illanes",   email: "felipe@amplifica.io",    role: "JEFATURA", titulo: "Jefe de Ventas" },
  ];

  console.log("=== CREANDO USUARIOS ===");
  const createdUsers = {};
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log(`  ⏭  Ya existe: ${u.name} (${u.email})`);
      createdUsers[u.email] = existing;
    } else {
      const user = await prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          role: u.role,
          passwordHash: hash,
          activo: true,
        },
      });
      console.log(`  ✓ Creado: ${u.name} [${u.role}]`);
      createdUsers[u.email] = user;
    }
  }

  // Also get Rubén
  const ruben = await prisma.user.findUnique({ where: { email: "ruben@amplifica.io" } });
  if (ruben) createdUsers["ruben@amplifica.io"] = ruben;

  console.log("\n=== ASIGNANDO DEALS POR BD ===");

  async function assignDeals(dealNames, bdNombre, email) {
    const user = createdUsers[email];
    if (!user) { console.log(`  ✗ Usuario no encontrado: ${email}`); return; }
    for (const nombre of dealNames) {
      // Fuzzy match: lower case compare
      const deals = await prisma.deal.findMany({
        where: { nombre: { contains: nombre.split(" ")[0], mode: "insensitive" } },
      });
      const match = deals.find(d =>
        d.nombre.toLowerCase().replace(/[^a-záéíóúñü ]/g, "").includes(
          nombre.toLowerCase().replace(/[^a-záéíóúñü ]/g, "").split(" ")[0]
        )
      );
      if (match) {
        await prisma.deal.update({
          where: { id: match.id },
          data: { businessDeveloper: bdNombre, propietarioId: user.id },
        });
        console.log(`  ✓ ${match.nombre} → ${bdNombre}`);
      } else {
        console.log(`  ✗ No encontrado: "${nombre}"`);
      }
    }
  }

  await assignDeals(DEALS_JT,     "José Tomás Costa", "josetomas@amplifica.io");
  await assignDeals(DEALS_MANUEL, "Manuel del Río",   "manuel@amplifica.io");
  await assignDeals(DEALS_RUBEN,  "Rubén Quintero",   "ruben@amplifica.io");

  // Summary
  console.log("\n=== RESUMEN FINAL ===");
  const total = await prisma.deal.count();
  const asignados = await prisma.deal.count({ where: { businessDeveloper: { not: null } } });
  const sinBD = await prisma.deal.findMany({ where: { businessDeveloper: null }, select: { nombre: true } });
  console.log(`Total deals: ${total}`);
  console.log(`Con BD asignado: ${asignados}`);
  if (sinBD.length > 0) {
    console.log(`Sin asignar (${sinBD.length}):`);
    sinBD.forEach(d => console.log(`  - ${d.nombre}`));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
