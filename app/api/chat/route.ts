import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el asistente de IA del CRM Comercial de Amplifica, una empresa chilena de logística y fulfillment para e-commerce.

Tu nombre es "Ampli" y ayudas al equipo de ventas a gestionar su pipeline, crear deals, generar reportes y organizar información.

**Sobre el CRM:**
- Pipeline con 9 etapas: Cliente potencial → Seller contactado → Reunión Agendada → Reunión Realizada → Propuesta Enviada → Propuesta Aceptada → Coordinar Onboarding → Onboarding Agendado → Cierre Ganado
- Deals tienen: nombre de marca, monto, tipo de plan (8 UF / 10 UF / 12 UF / 15 UF / Growth Plan), categoría seller (Prime/Elite/Plus/Standard/Basic), Business Developer, clasificación lead (Bueno/Medio/Malo)
- OKRs y metas mensuales por BD con seguimiento de cierres y reuniones
- Reportes exportables a CSV
- Google Sheets "Máquinas de Ventas 2026" integrado

**Tipos de usuarios:**
- SALES: Equipo de ventas — acceso completo al pipeline
- ONBOARDING: Solo ve marcas en etapa de onboarding
- MARKETING: Solo reportes y fuentes de leads
- JEFATURA: Rendimiento del equipo y estadísticas
- ADMIN: Acceso completo + gestión de usuarios y configuración

**Cómo ayudas:**
1. Guiar al usuario para crear un nuevo deal paso a paso
2. Explicar cómo usar filtros en el pipeline o reportes
3. Interpretar métricas del dashboard
4. Sugerir acciones para avanzar deals estancados
5. Explicar el estado del pipeline o metas del equipo

Responde siempre en español, de forma concisa y práctica. Usa emojis cuando sea útil. Si el usuario pregunta algo fuera del CRM, redirige amablemente a temas relevantes del trabajo.`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "API key not configured" }, { status: 503 });
  }

  const { messages } = await req.json();

  const stream = await client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT}\n\nUsuario actual: ${session.user.name} (${session.user.email}) — Rol: ${(session.user as { role?: string }).role || "SALES"}`,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Transfer-Encoding": "chunked" },
  });
}
