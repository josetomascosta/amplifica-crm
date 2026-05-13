// Cambia josetomas a ADMIN para que vea todo el sistema
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.update({
    where: { email: "josetomas@amplifica.io" },
    data: { role: "ADMIN" },
  });
  console.log(`✅ ${u.email} → rol: ${u.role}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
