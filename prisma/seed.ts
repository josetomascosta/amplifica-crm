import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function mapDealStage(dealstage: string | null | undefined): string {
  if (!dealstage) return 'Cliente potencial'
  const s = dealstage.toLowerCase()
  if (
    s === 'appointmentscheduled' ||
    s.includes('reunion_agendada')
  ) return 'Reunión Agendada'
  if (
    s === 'qualifiedtobuy' ||
    s.includes('reunion_realizada')
  ) return 'Reunión Realizada'
  if (
    s === 'presentationscheduled' ||
    s.includes('propuesta_enviada')
  ) return 'Propuesta Enviada'
  if (
    s === 'decisionmakerboughtin' ||
    s.includes('propuesta_aceptada')
  ) return 'Propuesta Aceptada'
  if (
    s === 'contractsent' ||
    s.includes('coordinar')
  ) return 'Coordinar Onboarding'
  if (
    s === 'closedwon' ||
    s.includes('cierre_ganado') ||
    s.includes('onboarding_agendado')
  ) return 'Cierre Ganado'
  if (s === 'closedlost' || s.includes('potencial') || s.includes('contactado')) return 'Cliente potencial'
  return 'Cliente potencial'
}

// HubSpot uses numeric stage IDs in this export — map them explicitly
function mapHubSpotStageId(stageId: string | null | undefined): string {
  if (!stageId) return 'Cliente potencial'
  // Pipeline 847921331 stages:
  // 1262836248 = Cierre Ganado (hs_deal_stage_probability = 1)
  // 1262836249 = Coordinar Onboarding / post-onboarding
  // Pipeline 834955119: 1239308925 = Store Leads (Cliente potencial)
  if (stageId === '1262836248') return 'Cierre Ganado'
  if (stageId === '1262836249') return 'Coordinar Onboarding'
  if (stageId === '1239308925') return 'Cliente potencial'
  return mapDealStage(stageId)
}

function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null
  // Remove dots used as Chilean thousand separators, keep commas as decimal
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

async function main() {
  // 1. Create default admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@amplifica.io' },
    update: {},
    create: {
      email: 'admin@amplifica.io',
      name: 'Admin',
      role: 'ADMIN',
    },
  })
  console.log(`Admin user ready: ${adminUser.email}`)

  // 2. Deal data extracted from HubSpot CRM export
  const deals = [
    {
      nombre: 'Nutribiota',
      dealstageId: '1262836248',
      amount: '695000',
      perfilCliente: 'Nutribiota es una marca de probióticos que ha operado solo el canal B2B, el cual seguirán gestionando de forma independiente. Llevan poco tiempo operando el B2C y el objetivo con Amplifica es potenciar ese canal. Las ventas se tomarán directamente desde su tienda Shopify, operando desde la sucursal de Lo Barnechea. En una primera etapa quieren aperturar Uber y después les gustaría que les tomemos las ventas de Mercado Libre operando desde Santiago Centro, para lo cual el cliente está dispuesto a hacer upgrade del plan de 8 UF al de 10 UF.',
      categoriasSeller: 'Standard',
      fuenteContacto: null,
      clasificacionLead: null,
      pedidosMensuales: '300',
      ticketPromedio: null,
      ecommerce: 'Shopify',
      appsDelivery: 'Ninguna',
      canalesActivos: null,
      tipoPlan: '8 UF + IVA hasta superar los 150 pedidos mensuales, luego $2.500 + IVA por pedido.',
      modeloCobro: null,
      cobroPorServicio: null,
      tarifaPorPedido: '2500',
      sucursales: 'Lo Barnechea',
      boost: null,
      fechaReunion: null,
      fechaOnboarding: '2026-05-12T16:00:00Z',
      fechaEnvioContrato: null,
      razonSocial: null,
      banco: null,
      resumenMarca: 'Mandarán el stock directamente a la sucursal de Lo Barnechea.',
      notasExcepciones: null,
      hsDealStageProbability: '1',
    },
    {
      nombre: 'PetMyPet',
      dealstageId: '1262836248',
      amount: '9450000',
      perfilCliente: 'PetMyPet es una marca que vende artículos de limpieza para mascotas. Es una marca con la que llevábamos mucho tiempo conversando y por fin quieren dar el salto de entrar a Amplifica. Actualmente procesan entre su ecommerce y MercadoLibre un promedio de 3.500 órdenes mensuales, canales que vamos a operar nosotros.',
      categoriasSeller: 'Prime',
      fuenteContacto: null,
      clasificacionLead: null,
      pedidosMensuales: '3500',
      ticketPromedio: null,
      ecommerce: 'Shopify',
      appsDelivery: 'Ninguna',
      canalesActivos: null,
      tipoPlan: 'Growth Plan',
      modeloCobro: null,
      cobroPorServicio: null,
      tarifaPorPedido: '1800',
      sucursales: 'Lo Barnechea;La Reina;Centro;Vina del Mar',
      boost: null,
      fechaReunion: null,
      fechaOnboarding: '2026-05-11T19:00:00Z',
      fechaEnvioContrato: null,
      razonSocial: null,
      banco: null,
      resumenMarca: 'Tienen una tarifa de almacenamiento en nuestro CD de 0,35 UF por metro cúbico. Se les ofreció el plan de Almacenamiento Full, ya que en una primera etapa van a mandar 50 m³ y quieren partir antes del Cyber. Los primeros 3 meses van a operar sin contrato, para que puedan conocer el servicio y validar la operación con total flexibilidad. A partir del mes 4 pasan a la modalidad de Almacenamiento Full, con un contrato por 1 año.',
      notasExcepciones: null,
      hsDealStageProbability: '1',
    },
    {
      nombre: 'EarProtect',
      dealstageId: '1262836248',
      amount: '958400',
      perfilCliente: 'Earprotect es una marca enfocada en soluciones de protección auditiva, trabajando principalmente la marca extranjera de protectores Alpine. Actualmente cuentan con operación en Mercado Libre y Falabella Marketplace, además de ecommerce propio, absorbiendo el costo de envío en compras sobre $20.000. La marca es liderada por Renato y hoy operan logísticamente con Bluexpress, pero buscan potenciar su crecimiento mediante una estructura más eficiente que les permita incorporar apps de delivery, puntos de retiro y servicios same day. Ingresan con plan Starter operando desde la sucursal de Santiago Centro, con tarifa de $2.500 por preparación de pedidos.',
      categoriasSeller: 'Standard',
      fuenteContacto: null,
      clasificacionLead: null,
      pedidosMensuales: '150',
      ticketPromedio: null,
      ecommerce: 'Shopify',
      appsDelivery: 'Ninguna',
      canalesActivos: null,
      tipoPlan: '8 UF + IVA hasta superar los 150 pedidos mensuales, luego $2.500 + IVA por pedido.',
      modeloCobro: null,
      cobroPorServicio: null,
      tarifaPorPedido: '2500',
      sucursales: 'Centro',
      boost: null,
      fechaReunion: null,
      fechaOnboarding: '2026-05-07T20:00:00Z',
      fechaEnvioContrato: null,
      razonSocial: null,
      banco: null,
      resumenMarca: null,
      notasExcepciones: null,
      hsDealStageProbability: '1',
    },
    {
      nombre: 'Niboo',
      dealstageId: '1262836248',
      amount: '753400',
      perfilCliente: 'Niboo es una nueva marca de alimentos para bebés liderada por Ignacio y Paulina, cuya propuesta de valor está enfocada en productos con alta calidad nutricional y contenciones alérgicas. El lanzamiento está proyectado para fines de mayo o principios de junio, con foco fuerte en canales de delivery y entrega inmediata por la naturaleza del producto. Ingresarán operando desde la sucursal de Lo Barnechea, en un mercado donde todavía existe poca competencia especializada, pero con buenas perspectivas de crecimiento por un equipo con mucha energía dedicada al emprendimiento y muy involucrado en el desarrollo de la marca y su expansión.',
      categoriasSeller: 'Basic',
      fuenteContacto: null,
      clasificacionLead: null,
      pedidosMensuales: '0',
      ticketPromedio: null,
      ecommerce: 'Shopify',
      appsDelivery: 'Ninguna',
      canalesActivos: null,
      tipoPlan: '8 UF + IVA hasta superar los 150 pedidos mensuales, luego $2.500 + IVA por pedido.',
      modeloCobro: null,
      cobroPorServicio: null,
      tarifaPorPedido: '2200',
      sucursales: 'Lo Barnechea',
      boost: null,
      fechaReunion: null,
      fechaOnboarding: '2026-05-07T20:00:00Z',
      fechaEnvioContrato: null,
      razonSocial: null,
      banco: null,
      resumenMarca: 'Se le aplicó un descuento en la preparación de pedidos por los meses de mayo, junio y Julio quedando en $2.000 + IVA',
      notasExcepciones: null,
      hsDealStageProbability: '1',
    },
    {
      nombre: 'Santa Gota',
      dealstageId: '1262836248',
      amount: '725000',
      perfilCliente: 'Santa Gota es una marca chilena de aceite de oliva que saldrá al mercado durante mayo y junio. Pero, lo principal y mas atractivo del producto es su presentación, ya que será en squeeze bottles inspirado en la marca Graza (muy conocida en EEUU y pioneros), lo cual es una novedad acá en Chile. Gonzalo (Socio y Fundador) proyecta que será un boom y tener presencia no solo digital, sino también en supermercados y con una campaña de entrada al mercado muy potente.',
      categoriasSeller: 'Basic',
      fuenteContacto: null,
      clasificacionLead: null,
      pedidosMensuales: '150',
      ticketPromedio: null,
      ecommerce: 'Shopify',
      appsDelivery: 'Ninguna',
      canalesActivos: null,
      tipoPlan: '12 UF + IVA hasta superar los 150 pedidos mensuales, luego $2.500 + IVA por pedido.',
      modeloCobro: null,
      cobroPorServicio: null,
      tarifaPorPedido: '2500',
      sucursales: 'Vina del Mar;Centro;La Reina;Lo Barnechea',
      boost: null,
      fechaReunion: null,
      fechaOnboarding: '2026-05-05T16:00:00Z',
      fechaEnvioContrato: null,
      razonSocial: null,
      banco: null,
      resumenMarca: 'El seller se encuentra en proceso de construcción de su shopify (avanzado) y producción de sus productos. Esta manteniendo la imagen y todo lo relacionado a su producto de manera confidencial por su novedad acá en Chile, aunque ya me lo mostró durante la reunión.',
      notasExcepciones: null,
      hsDealStageProbability: '1',
    },
    {
      nombre: 'UDLA',
      dealstageId: '1262836248',
      amount: '320000',
      perfilCliente: 'UDLA es un ecommerce de la Universidad de las Américas. Venden productos institucionales como mouse pads, botellas, teclados, entre otros. Es un cliente con el que venimos trabajando junto al área de TI, y es nuestro primer cliente con tienda en Jumpseller.',
      categoriasSeller: 'Basic',
      fuenteContacto: null,
      clasificacionLead: null,
      pedidosMensuales: '0',
      ticketPromedio: null,
      ecommerce: 'Jumpseller',
      appsDelivery: 'Ninguna',
      canalesActivos: null,
      tipoPlan: '8 UF + IVA hasta superar los 150 pedidos mensuales, luego $2.500 + IVA por pedido.',
      modeloCobro: null,
      cobroPorServicio: null,
      tarifaPorPedido: '2500',
      sucursales: 'La Reina',
      boost: null,
      fechaReunion: null,
      fechaOnboarding: '2026-05-04T15:00:00Z',
      fechaEnvioContrato: null,
      razonSocial: null,
      banco: null,
      resumenMarca: 'Van a operar únicamente desde la sucursal de La Reina, por lo que enviarán stock directamente a LR.',
      notasExcepciones: null,
      hsDealStageProbability: '1',
    },
    {
      nombre: 'Kanka',
      dealstageId: '1262836248',
      amount: '2700000',
      perfilCliente: 'KANKA es la mejor marca de asadores portátiles y accesorios de alta gama, con presencia no solo en Chile, sino en EEUU y Mexico. Su producto estrella, el Asador KANKA, es un sistema de asado rotatorio, eléctrico y desarmable que permite cocinar hasta 10 kilos de carne con autonomía. Con un ecosistema que incluye cuchillos de acero Damasco y menaje de hierro fundido.',
      categoriasSeller: 'Plus',
      fuenteContacto: null,
      clasificacionLead: null,
      pedidosMensuales: '800',
      ticketPromedio: null,
      ecommerce: 'Shopify',
      appsDelivery: 'Ninguna',
      canalesActivos: null,
      tipoPlan: 'Growth Plan',
      modeloCobro: null,
      cobroPorServicio: null,
      tarifaPorPedido: '2500',
      sucursales: 'Vina del Mar;Centro;La Reina;Lo Barnechea',
      boost: null,
      fechaReunion: null,
      fechaOnboarding: '2026-04-30T15:30:00Z',
      fechaEnvioContrato: null,
      razonSocial: null,
      banco: null,
      resumenMarca: 'El seller tendrá una tarifa en almacenamiento de 0 UF + IVA x m3 por mayo y junio. Luego se cobrará 0,35 UF + IVA x m3. Además, debemos configurar las tarifas y los despachos SIN incluir las siguientes regiones: Arica, Tarapacá, Aysén y Magallanes.',
      notasExcepciones: null,
      hsDealStageProbability: '1',
    },
    {
      nombre: 'LatamHair',
      dealstageId: '1262836248',
      amount: '950000',
      perfilCliente: 'Felipe es el dueño de LatamHair. Tienen la representación de una marca australiana. Hoy día están operando con WooCommerce y están haciendo el cambio a Shopify, van a partir de inmediato con Shopify. Hoy día tienen alrededor de 350 órdenes mensuales y con el cambio a Shopify deberían seguir aumentando.',
      categoriasSeller: 'Standard',
      fuenteContacto: null,
      clasificacionLead: null,
      pedidosMensuales: '300',
      ticketPromedio: null,
      ecommerce: 'Shopify',
      appsDelivery: 'Ninguna',
      canalesActivos: null,
      tipoPlan: 'Growth Plan',
      modeloCobro: null,
      cobroPorServicio: null,
      tarifaPorPedido: '2500',
      sucursales: 'Lo Barnechea;La Reina;Centro;Vina del Mar',
      boost: null,
      fechaReunion: null,
      fechaOnboarding: '2026-04-27T15:00:00Z',
      fechaEnvioContrato: null,
      razonSocial: null,
      banco: null,
      resumenMarca: 'LatamHair va a mandar mercadería directamente al CD y tenemos que hacer la redistribución a las dark stores. Se les ofreció un plan de almacenamiento full por 10 m³.',
      notasExcepciones: null,
      hsDealStageProbability: '1',
    },
    {
      nombre: 'María Larraín Joyas',
      dealstageId: '1262836249',
      amount: '1278728',
      perfilCliente: 'María Larraín Joyas es una marca de joyería enfocada en piezas de diseño con identidad propia, fundada por Bernardita y Maida, quienes buscan tercerizar su logística para enfocarse en el crecimiento del negocio, especialmente de cara a la temporada de invierno y el Día de la Madre. Ingresan con plan Starter de 8 UF operando desde la sucursal de Lo Barnechea, con el objetivo de fortalecer su propuesta de valor en consumo tipo regalo, explorando la apertura de canales como Uber y otras apps de delivery. Es un proyecto con buena oportunidad de crecimiento en fechas clave si logra mejorar su cobertura y velocidad de entrega.',
      categoriasSeller: 'Standard',
      fuenteContacto: null,
      clasificacionLead: null,
      pedidosMensuales: '250',
      ticketPromedio: null,
      ecommerce: 'Shopify',
      appsDelivery: 'Ninguna',
      canalesActivos: null,
      tipoPlan: '8 UF + IVA hasta superar los 150 pedidos mensuales, luego $2.500 + IVA por pedido.',
      modeloCobro: null,
      cobroPorServicio: null,
      tarifaPorPedido: '2500',
      sucursales: 'Lo Barnechea',
      boost: null,
      fechaReunion: null,
      fechaOnboarding: '2026-04-23T20:00:00Z',
      fechaEnvioContrato: null,
      razonSocial: null,
      banco: null,
      resumenMarca: 'Urgencia en apertura de Apps de delivery de cara al día de la madre. Están preparando sus productos para operar con nosotros etiquetando sus productos.',
      notasExcepciones: null,
      hsDealStageProbability: '1',
    },
    {
      nombre: 'Big Natural',
      dealstageId: '1262836248',
      amount: '896000',
      perfilCliente: 'Big Natural es una tienda chilena especializada en suplementos alimenticios 100% naturales y de alta pureza. Con un catálogo que incluye superalimentos y compuestos clave como Berberina, Magnesio y Ashwagandha, la marca se distingue por contar con resolución sanitaria y fabricar sus productos en laboratorios nacionales de trayectoria. Hoy día generan 300 pedidos en promedio solo a través de su página web, concentrando la mayoría de sus clientes en la zona central de Santiago, pero con mucha proyección de crecimiento, ya que se encuentran innovando nuevos productos.',
      categoriasSeller: 'Standard',
      fuenteContacto: null,
      clasificacionLead: null,
      pedidosMensuales: '280',
      ticketPromedio: null,
      ecommerce: 'Shopify',
      appsDelivery: 'Ninguna',
      canalesActivos: null,
      tipoPlan: 'Growth Plan',
      modeloCobro: null,
      cobroPorServicio: null,
      tarifaPorPedido: '2500',
      sucursales: 'Centro;Lo Barnechea',
      boost: null,
      fechaReunion: null,
      fechaOnboarding: '2026-04-24T19:00:00Z',
      fechaEnvioContrato: null,
      razonSocial: null,
      banco: null,
      resumenMarca: 'El seller iniciará idealmente en Santiago Centro y Lo Barnechea, pero es posible que vayan a utilizar La Reina también. Esto quedará sujeto a evaluación según disponibilidad de producción del laboratorio.',
      notasExcepciones: null,
      hsDealStageProbability: '1',
    },
    {
      nombre: 'Tiffosi',
      dealstageId: '1262836248',
      amount: '1300000',
      perfilCliente: 'Tiffosi es una marca uruguaya enfocada en artículos deportivos y accesorios como mochilas, neceseres y calcetines, operada en Chile por Rocío Recabarren. Actualmente trabajan únicamente con su ecommerce en Shopify y buscan extender su propuesta de valor mediante la apertura de nuevos canales y puntos de retiro. Rocío llegó a Amplifica tras haber tenido una buena experiencia previa como cliente con nuestros envíos, lo que facilita la adopción del modelo. Ingresan con plan Starter, operando inicialmente con 1 sucursal, 20 m³ en el CD y servicio de redistribución, con tarifa de $2.500 por preparación de pedidos incluyendo los primeros 150 pedidos sin costo. Es un proyecto con potencial de crecimiento al ampliar canales y mejorar cobertura logística.',
      categoriasSeller: 'Basic',
      fuenteContacto: null,
      clasificacionLead: null,
      pedidosMensuales: '150',
      ticketPromedio: null,
      ecommerce: 'Shopify',
      appsDelivery: 'Ninguna',
      canalesActivos: null,
      tipoPlan: '8 UF + IVA hasta superar los 150 pedidos mensuales, luego $2.500 + IVA por pedido.',
      modeloCobro: null,
      cobroPorServicio: null,
      tarifaPorPedido: '2500',
      sucursales: 'Vina del Mar;Centro',
      boost: null,
      fechaReunion: null,
      fechaOnboarding: '2026-04-22T19:00:00Z',
      fechaEnvioContrato: null,
      razonSocial: null,
      banco: null,
      resumenMarca: 'Plan de Almacenamiento Full con 20 m3 de Almacenamiento en CD con Redistribución hacia Santiago Centro',
      notasExcepciones: null,
      hsDealStageProbability: '1',
    },
    {
      nombre: 'Bienestar Animal',
      dealstageId: '1262836248',
      amount: '450000',
      perfilCliente: 'Bienestar Animal es una marca que vende artículos de mascota, desde arneses, alimentos y suplementos. Hoy en día tienen alrededor de 200 órdenes mensuales y debería ir en constante aumento. Son los mismos dueños de New Pharma, que ya está operando con Amplifica. Van a meter una tercera marca que es Astral Superfoods.',
      categoriasSeller: 'Standard',
      fuenteContacto: null,
      clasificacionLead: null,
      pedidosMensuales: '200',
      ticketPromedio: null,
      ecommerce: 'Shopify',
      appsDelivery: 'Ninguna',
      canalesActivos: null,
      tipoPlan: 'Growth Plan',
      modeloCobro: null,
      cobroPorServicio: null,
      tarifaPorPedido: '2200',
      sucursales: 'La Reina',
      boost: null,
      fechaReunion: null,
      fechaOnboarding: '2026-04-27T13:00:00Z',
      fechaEnvioContrato: null,
      razonSocial: null,
      banco: null,
      resumenMarca: 'Van a mandar la mercadería directamente a la sucursal de La Reina en una primera etapa y después quieren ir abriendo las demás sucursales.',
      notasExcepciones: null,
      hsDealStageProbability: '1',
    },
  ]

  // 3. Upsert all deals and create SISTEMA activities
  // Note: Deal.nombre has no @unique in schema, so we use findFirst + create/update manually
  for (const d of deals) {
    const etapa = mapHubSpotStageId(d.dealstageId)
    const probabilidad = d.hsDealStageProbability ? parseFloat(d.hsDealStageProbability) : null

    const dealData = {
      etapa,
      monto: parseNumber(d.amount),
      probabilidad,
      perfilCliente: d.perfilCliente ?? null,
      categoriasSeller: d.categoriasSeller ?? null,
      fuenteContacto: d.fuenteContacto ?? null,
      clasificacionLead: d.clasificacionLead ?? null,
      pedidosMensuales: d.pedidosMensuales ? parseInt(d.pedidosMensuales, 10) : null,
      ticketPromedio: parseNumber(d.ticketPromedio ?? null),
      ecommerce: d.ecommerce ?? null,
      appsDelivery: d.appsDelivery ?? null,
      canalesActivos: d.canalesActivos ?? null,
      tipoPlan: d.tipoPlan ?? null,
      modeloCobro: d.modeloCobro ?? null,
      cobroPorServicio: d.cobroPorServicio ?? null,
      tarifaPorPedido: parseNumber(d.tarifaPorPedido ?? null),
      sucursales: d.sucursales ?? null,
      boost: d.boost ?? null,
      fechaReunion: parseDate(d.fechaReunion ?? null),
      fechaOnboarding: parseDate(d.fechaOnboarding ?? null),
      fechaEnvioContrato: parseDate(d.fechaEnvioContrato ?? null),
      razonSocial: d.razonSocial ?? null,
      banco: d.banco ?? null,
      resumenMarca: d.resumenMarca ?? null,
      notasExcepciones: d.notasExcepciones ?? null,
    }

    const existing = await prisma.deal.findFirst({ where: { nombre: d.nombre } })

    let deal
    if (existing) {
      deal = await prisma.deal.update({
        where: { id: existing.id },
        data: dealData,
      })
    } else {
      deal = await prisma.deal.create({
        data: {
          nombre: d.nombre,
          moneda: 'CLP',
          propietarioId: adminUser.id,
          ...dealData,
        },
      })
    }

    // Create SISTEMA activity for this deal
    await prisma.actividad.create({
      data: {
        tipo: 'SISTEMA',
        titulo: 'Deal importado desde HubSpot',
        descripcion: `Deal "${d.nombre}" importado automáticamente desde HubSpot CRM.`,
        dealId: deal.id,
        autorId: adminUser.id,
      },
    })

    console.log(`Upserted deal: ${d.nombre} → ${etapa}`)
  }

  console.log(`\nSeed completado: ${deals.length} deals insertados/actualizados.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
