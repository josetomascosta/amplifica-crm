// Resetea TODAS las contraseñas al estándar inicial: Amplifica2026
// Ejecutar: node scripts/reset-all-passwords.cjs
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const NUEVA_CLAVE = "Amplifica2026";

async function main() {
  console.log(`\n=== RESETEANDO CONTRASEÑAS A: "${NUEVA_CLAVE}" ===\n`);

  const users = await prisma.user.findMany();
  const hash = await bcrypt.hash(NUEVA_CLAVE, 10);

  for (const u of users) {
    await prisma.user.update({
      where: { id: u.id },
      data: { passwordHash: hash },
    });
    console.log(`✓ ${u.email} (${u.role})`);
  }

  console.log(`\n✅ ${users.length} usuarios actualizados.`);
  console.log(`   Contraseña: ${NUEVA_CLAVE}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
