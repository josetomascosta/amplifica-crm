# CRM Amplifica — CLAUDE.md

## Proyecto
CRM interno que reemplaza HubSpot. Next.js 14 App Router + Supabase/PostgreSQL + Prisma + NextAuth v5.

## Stack
- **Framework**: Next.js 14 (App Router)
- **BD**: PostgreSQL vía Supabase + Prisma ORM
- **Auth**: NextAuth v5 + Google OAuth — SOLO @amplifica.io
- **Kanban**: @dnd-kit/core
- **Data fetch**: SWR
- **AI**: @anthropic-ai/sdk (claude-sonnet-4-6)
- **Email**: Resend

## Brand — SIEMPRE respetar
```css
--amplifica-blue:       #4548FF;
--amplifica-yellow:     #F7DC4B;
--amplifica-dark-blue:  #121755;
--amplifica-dark-gray:  #1D1D1F;
--amplifica-light-gray: #E1E0E0;
--amplifica-bg:         #F0F2F7;
```
- **Headings**: Barlow Condensed 700, uppercase
- **Body**: Inter 400/500/600
- **Sidebar**: fondo #121755
- **Cards**: blanco, border 1px #E1E0E0, radius 12px
- **Botones primarios**: #4548FF, hover #3335dd, radius 8px
- **Sin gradientes decorativos nunca**
- **Spacing**: múltiplos de 4px

## Auth — NUNCA eliminar
```ts
// Validación en DOS lugares: lib/auth.ts Y middleware.ts
callbacks: {
  async signIn({ user }) {
    if (!user.email?.endsWith("@amplifica.io")) return false
    return true
  }
}
```

## Pipeline — 9 etapas
1. Cliente potencial 🦁 (20%)
2. Seller contactado (20%)
3. Reunión Agendada 📅
4. Reunión Realizada ✅ (70%)
5. Propuesta Enviada 📄 (80%)
6. Propuesta Aceptada 🥳 (90%)
7. Coordinar Onboarding 🤝🏻
8. Onboarding Agendado 📆 (100%)
9. Cierre Ganado 🤑 (100%)

## Reglas críticas
1. Log de Actividad es **INMUTABLE** — nunca agregar DELETE en /api/actividades
2. APIs de Apollo y Storeleads **SOLO** van en API Routes de Next.js (nunca al frontend)
3. **Optimistic updates** en Kanban — drag & drop debe sentirse instantáneo
4. Row Level Security en Supabase — cada user ve solo sus deals (ADMIN bypassa)

## Estado MVP actual
- ✅ Fase 1: Setup, Auth, Login page
- ✅ Fase 2: Sidebar, Topbar, Layout
- ✅ Fase 3: Pipeline Kanban con drag & drop + panel lateral
- ✅ Fase 4: CRUD básico de deals (modal nuevo deal, edición en panel)
- ✅ Fase 5: Dashboard con KPIs

## Próximas fases (fuera del MVP)
- Fase 2 del proyecto: Gmail sync, Calendar sync, automatizaciones de email, Máquinas de Ventas
- Fase 3: Búsqueda con IA / Claude API
- Fase 4: Generación de contratos, importación Apollo/Storeleads

## Variables de entorno requeridas
```
DATABASE_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
ANTHROPIC_API_KEY=
RESEND_API_KEY=
```
