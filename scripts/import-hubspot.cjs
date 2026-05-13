const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// Map HubSpot stage names → CRM stage names
const STAGE_MAP = {
  "Cierre Ganado 🤓": "Cierre Ganado 🤑",
  "Onboarding Agendado 🏁": "Onboarding Agendado 📆",
  "Coordinar Onboarding 🏃🏻‍♂️": "Coordinar Onboarding 🤝🏻",
  "Reunión Realizada ✅": "Reunión Realizada ✅",
  "Reunión Agendada 📆": "Reunión Agendada 📅",
  "Propuesta Enviada 📖": "Propuesta Enviada 📄",
  "Propuesta Aceptada 🥳": "Propuesta Aceptada 🥳",
  "Seller Potencial 🦈": "Cliente potencial 🦁",
  "Cliente potencial 🦈": "Cliente potencial 🦁",
  "Seller contactado": "Seller contactado",
  "Reintentar a Futuro / Standby": "Cliente potencial 🦁",
  "Cliente Califica / E-commerce en desarrollo": "Reunión Realizada ✅",
};

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || "").trim(); });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseNum(val) {
  if (!val || val === "") return null;
  const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? null : n;
}

function parseDate(val) {
  if (!val || val === "") return null;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

function mapStage(hubspotStage) {
  if (!hubspotStage) return "Cliente potencial 🦁";
  return STAGE_MAP[hubspotStage] || hubspotStage;
}

async function main() {
  const csvPath = "C:\\Users\\José Tomás Costa\\Downloads\\hubspot-crm-exports-todos-negocios-2026-05-12.csv";

  if (!fs.existsSync(csvPath)) {
    console.error("CSV no encontrado en:", csvPath);
    process.exit(1);
  }

  const rows = parseCSV(csvPath);
  console.log(`\nTotal filas en CSV: ${rows.length}`);

  // Deduplicate by name + stage (keep first occurrence)
  const seen = new Set();
  const unique = rows.filter(row => {
    const key = row["Nombre del negocio"] + "|" + row["Etapa del negocio"];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`Después de deduplicar: ${unique.length} marcas\n`);

  let created = 0;
  let skipped = 0;

  for (const row of unique) {
    const nombre = row["Nombre del negocio"];
    if (!nombre) { skipped++; continue; }

    const etapa = mapStage(row["Etapa del negocio"]);
    const monto = parseNum(row["Valor"]);
    const tarifaPorPedido = parseNum(row["Tarifa por pedido ($)"]);
    const pedidosMensualesB2C = parseNum(row["Pedidos mensuales B2C"]);
    const ticketPromedio = parseNum(row["Ticket Promedio CLP"]);
    const fechaReunion = parseDate(row["Fecha de Reunión"] || row["Fecha Reunión"]);
    const fechaOnboarding = parseDate(row["Fecha de Reunión de Onboarding"]);
    const fechaEnvioContrato = parseDate(row["Fecha envío contrato"]);
    const validadoPorTi = row["Validado por TI"] === "true" || row["Validado por TI"] === "Sí";

    try {
      await prisma.deal.create({
        data: {
          nombre,
          etapa,
          monto,
          moneda: row["Moneda"] || "CLP",
          businessDeveloper: row["Business developer asignado"] || null,
          tarifaPorPedido,
          pedidosMensuales: pedidosMensualesB2C ? Math.round(pedidosMensualesB2C) : null,
          ticketPromedio,
          tipoPlan: row["Tipo de Plan"] || null,
          modeloCobro: row["Modelo de cobro"] || null,
          cobroPorServicio: row["Cobro por servicio"] || null,
          sucursales: row["Sucursales Activas"] || null,
          boost: row["Boost"] || row["Amplifica Boost"] || null,
          ecommerce: row["E-Commerce"] || row["E-Commerce (antiguo)"] || null,
          appsDelivery: row["Apps de Delivery Activas"] || null,
          canalesActivos: row["Canales Activos"] || row["Canales Activos de Venta"] || null,
          razonSocial: row["Razón Social"] || null,
          banco: row["Banco"] || null,
          notasExcepciones: row["Notas y excepciones"] || row["Comentarios Adicionales"] || null,
          clasificacionLead: row["Clasificación del Lead"] || row["Clasificación de lead"] || null,
          fuenteContacto: row["Fuente del contacto"] || null,
          perfilCliente: row["Perfil del cliente"] || null,
          categoriasSeller: row["Categoría Seller"] || null,
          businessDeveloper: row["Business developer asignado"] || null,
          validadoPorTi,
          fechaReunion,
          fechaOnboarding,
          fechaEnvioContrato,
        },
      });
      console.log(`  ✓ ${nombre} (${etapa})`);
      created++;
    } catch (err) {
      console.error(`  ✗ Error en "${nombre}": ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n=== RESULTADO ===`);
  console.log(`✅ Creados: ${created}`);
  console.log(`⏭️  Saltados: ${skipped}`);

  // Summary by stage
  const byStage = await prisma.deal.groupBy({ by: ["etapa"], _count: { id: true }, orderBy: { _count: { id: "desc" } } });
  console.log(`\nPor etapa:`);
  byStage.forEach(s => console.log(`  ${s._count.id}x ${s.etapa}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
