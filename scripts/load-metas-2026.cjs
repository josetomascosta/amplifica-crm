// Carga metas mensuales 2026 para todos los BD y SDR desde datos del Excel
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MESES = ["2026-01","2026-02","2026-03","2026-04","2026-05",
                "2026-06","2026-07","2026-08","2026-09","2026-10","2026-11","2026-12"];

// Objetivos de reuniones por mes (del Excel, fila 24 de cada hoja BD)
const OBJ_REUNIONES = {
  "Manuel del Río":   [20,20,20,20,20,20,20,20,20,20,20,20],
  "José Tomás Costa": [10,10,15,15,15,15,15,15,15,15,15,15],
  "Rubén Quintero":   [10,10,15,15,15,15,15,15,15,15,15,15],
  "Felipe Aburto":    [25,25,25,25,25,25,25,25,25,25,25,25], // SDR: total agendadas/mes
};

// Objetivos de pedidos por mes (fila 28 de cada hoja BD)
const OBJ_PEDIDOS = {
  "Manuel del Río":   [1140, 920,3660,1760,2500,2200,2460,1620,3520,1620,2360, 715],
  "José Tomás Costa": [ 570, 610,3660,1760,2500,2200,2460,1620,3520,1620,2360, 715],
  "Rubén Quintero":   [ 570, 610,3660,1760,2500,2200,2460,1620,3520,1620,2360, 715],
};

// Objetivo de cierres mensuales (del Excel, columna "Objetivo cierres")
const OBJ_CIERRES = {
  "Manuel del Río":   [2,2,2,2,2,2,2,2,2,2,2,2],
  "José Tomás Costa": [1,1,2,2,2,2,2,2,2,2,2,2],
  "Rubén Quintero":   [1,1,2,2,2,2,2,2,2,2,2,2],
};

async function upsertMeta(mes, tipo, assignee, objetivo) {
  await prisma.metaMensual.upsert({
    where: { mes_tipo_assignee: { mes, tipo, assignee } },
    update: { objetivo },
    create: { mes, tipo, assignee, objetivo },
  });
}

async function main() {
  console.log("=== CARGANDO METAS 2026 ===\n");

  for (const [bd, objetivos] of Object.entries(OBJ_REUNIONES)) {
    for (let i = 0; i < 12; i++) {
      await upsertMeta(MESES[i], "reuniones", bd, objetivos[i]);
    }
    console.log(`✓ Reuniones/mes cargadas: ${bd}`);
  }

  for (const [bd, objetivos] of Object.entries(OBJ_PEDIDOS)) {
    for (let i = 0; i < 12; i++) {
      await upsertMeta(MESES[i], "pedidos", bd, objetivos[i]);
    }
    console.log(`✓ Pedidos/mes cargados: ${bd}`);
  }

  for (const [bd, objetivos] of Object.entries(OBJ_CIERRES)) {
    for (let i = 0; i < 12; i++) {
      await upsertMeta(MESES[i], "cierres", bd, objetivos[i]);
    }
    console.log(`✓ Cierres/mes cargados: ${bd}`);
  }

  const total = await prisma.metaMensual.count();
  console.log(`\n✅ Total registros MetaMensual: ${total}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
