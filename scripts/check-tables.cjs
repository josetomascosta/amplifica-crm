const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;
  console.log("\n=== TABLAS EN SUPABASE ===");
  tables.forEach((t) => console.log(" •", t.tablename));

  // Check specific tables
  const toCheck = ["Reunion", "CompromisoSemanal", "PasswordResetToken", "MetaMensual"];
  console.log("\n=== VERIFICACIÓN ===");
  for (const name of toCheck) {
    try {
      const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as n FROM "${name}"`);
      console.log(`✅ ${name}: ${count[0].n} registros`);
    } catch (e) {
      console.log(`❌ ${name}: NO EXISTE`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
