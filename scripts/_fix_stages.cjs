const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const STAGE_MAP = {
  "Cierre Ganado 🤑": "Cierre Ganado",
  "Cliente potencial 🦁": "Cliente potencial",
  "Onboarding Agendado 📆": "Onboarding Agendado",
  "Propuesta Aceptada 🥳": "Propuesta Aceptada",
  "Propuesta Enviada 📄": "Propuesta Enviada",
  "Reunión Realizada ✅": "Reunión Realizada",
  "Reunión Agendada 📅": "Reunión Agendada",
  "Coordinar Onboarding 🤝🏻": "Coordinar Onboarding",
};

async function main() {
  let fixed = 0;
  for (const [from, to] of Object.entries(STAGE_MAP)) {
    const result = await prisma.deal.updateMany({ where: { etapa: from }, data: { etapa: to } });
    if (result.count > 0) { console.log(`✓ ${from} → ${to} (${result.count})`); fixed += result.count; }
  }
  console.log(`\n✅ ${fixed} deals normalizados`);
  const etapas = await prisma.deal.groupBy({ by: ["etapa"], _count: true });
  etapas.forEach(e => console.log(`  "${e.etapa}": ${e._count} deals`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
