export type PipelineStage = {
  id: string;
  label: string;
  emoji: string;
  probability: number | null;
  color: "orange" | "blue" | "purple" | "green";
};

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: "Cliente potencial", label: "Cliente potencial", emoji: "🦁", probability: 20, color: "orange" },
  { id: "Seller contactado", label: "Seller contactado", emoji: "", probability: 20, color: "orange" },
  { id: "Reunión Agendada", label: "Reunión Agendada", emoji: "📅", probability: null, color: "blue" },
  { id: "Reunión Realizada", label: "Reunión Realizada", emoji: "✅", probability: 70, color: "blue" },
  { id: "Propuesta Enviada", label: "Propuesta Enviada", emoji: "📄", probability: 80, color: "purple" },
  { id: "Propuesta Aceptada", label: "Propuesta Aceptada", emoji: "🥳", probability: 90, color: "purple" },
  { id: "Coordinar Onboarding", label: "Coordinar Onboarding", emoji: "🤝🏻", probability: null, color: "green" },
  { id: "Onboarding Agendado", label: "Onboarding Agendado", emoji: "📆", probability: 100, color: "green" },
  { id: "Cierre Ganado", label: "Cierre Ganado", emoji: "🤑", probability: 100, color: "green" },
];

export const STAGE_COLORS: Record<string, string> = {
  orange: "#f97316",
  blue: "#4548FF",
  purple: "#8b5cf6",
  green: "#22c55e",
};

export const CATEGORIA_OPTIONS = ["Prime", "Elite", "Plus", "Standard", "Basic"];
export const FUENTE_OPTIONS = ["Redes Sociales", "Formulario", "Llamada", "Referido"];
export const CLASIFICACION_OPTIONS = ["Bueno", "Medio", "Malo"];
export const ECOMMERCE_OPTIONS = ["Shopify", "WooCommerce", "Jumpseller", "VTEX", "Otro"];
export const TIPO_PLAN_OPTIONS = ["8 UF", "10 UF", "12 UF", "15 UF", "Growth Plan"];
export const MODELO_COBRO_OPTIONS = ["Comisión por Venta", "Fijo por pedido", "Plan Starter", "Otro"];
export const BOOST_OPTIONS = ["Coordinar", "En prueba gratis", "Servicio contratado", "No"];
