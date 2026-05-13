const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({
    select: { email: true, name: true, role: true, activo: true, passwordHash: true }
  });
  console.log("\n=== USUARIOS ===");
  users.forEach((u) => {
    console.log(`${u.email} | ${u.role} | ${u.activo ? "✅ activo" : "❌ INACTIVO"} | ${u.passwordHash ? "tiene hash" : "SIN HASH (usa default)"}`);
  });
}

main().catch(console.error).finally(() => p.$disconnect());
