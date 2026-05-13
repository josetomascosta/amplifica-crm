const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const deals = await prisma.deal.findMany({ select: { etapa: true, nombre: true } });
  const etapas = [...new Set(deals.map(d => d.etapa))].sort();
  console.log("=== ETAPAS EN BD ===");
  etapas.forEach(e => {
    const count = deals.filter(d => d.etapa === e).length;
    console.log(`"${e}" (${count} deals)`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
