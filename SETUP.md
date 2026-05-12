# Cómo arrancar el CRM Amplifica

## 1. Instalar Node.js
Descarga e instala Node.js 20 LTS desde https://nodejs.org

## 2. Instalar dependencias
```bash
cd amplifica-crm
npm install
```

## 3. Configurar variables de entorno
```bash
cp .env.local.example .env.local
```
Completa el archivo `.env.local` con:
- `DATABASE_URL` — URL de tu proyecto en Supabase
- `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` — desde Google Cloud Console
- `NEXTAUTH_SECRET` — genera uno con: `openssl rand -base64 32`
- `NEXTAUTH_URL` — `http://localhost:3000` para desarrollo

## 4. Configurar Google OAuth
1. Ve a https://console.cloud.google.com
2. Crea un proyecto o usa uno existente
3. APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`

## 5. Inicializar base de datos
```bash
npx prisma generate
npx prisma db push
```

## 6. Levantar el servidor
```bash
npm run dev
```
Abre http://localhost:3000

---

## Estructura del proyecto
```
amplifica-crm/
├── app/
│   ├── (auth)/login/      # Pantalla de login
│   ├── (app)/             # Área autenticada
│   │   ├── dashboard/     # Dashboard con KPIs
│   │   ├── pipeline/      # Kanban board
│   │   ├── marcas/        # Placeholder
│   │   ├── importar/      # Placeholder
│   │   └── reportes/      # Placeholder
│   └── api/
│       ├── auth/          # NextAuth handlers
│       └── deals/         # CRUD + stage change
├── components/
│   ├── kanban/            # Board, Column, DealCard, DealPanel
│   ├── modals/            # NewDealModal
│   ├── sidebar.tsx
│   ├── topbar.tsx
│   └── ui/
│       └── amplifica-logo.tsx
├── lib/
│   ├── auth.ts            # NextAuth config
│   ├── prisma.ts          # Prisma client
│   ├── pipeline.ts        # Stages, colores, opciones
│   └── utils.ts           # Helpers
├── prisma/schema.prisma
├── middleware.ts           # Protección de rutas
└── CLAUDE.md              # Contexto para Claude Code
```
