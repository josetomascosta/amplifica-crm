-- ============================================================
-- EJECUTAR EN SUPABASE SQL EDITOR
-- Crea las 3 tablas faltantes: Reunion, CompromisoSemanal, PasswordResetToken
-- ============================================================

-- 1. Tabla Reunion
CREATE TABLE IF NOT EXISTS "Reunion" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "fecha"      TIMESTAMP(3) NOT NULL,
  "bdNombre"   TEXT NOT NULL,
  "dealNombre" TEXT,
  "realizada"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reunion_pkey" PRIMARY KEY ("id")
);

-- 2. Tabla CompromisoSemanal
CREATE TABLE IF NOT EXISTS "CompromisoSemanal" (
  "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "semana"              TEXT NOT NULL,
  "bdNombre"            TEXT NOT NULL,
  "compromisoReuniones" INTEGER NOT NULL DEFAULT 0,
  "logradoReuniones"    BOOLEAN NOT NULL DEFAULT false,
  "compromisoPedidos"   INTEGER NOT NULL DEFAULT 0,
  "logradoPedidos"      BOOLEAN NOT NULL DEFAULT false,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CompromisoSemanal_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CompromisoSemanal_semana_bdNombre_key" UNIQUE ("semana", "bdNombre")
);

-- 3. Tabla PasswordResetToken
CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email"     TEXT NOT NULL,
  "token"     TEXT NOT NULL,
  "expires"   TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PasswordResetToken_token_key" UNIQUE ("token")
);

-- ============================================================
-- Verificar que se crearon:
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('Reunion', 'CompromisoSemanal', 'PasswordResetToken')
ORDER BY tablename;
