# Setup CRM Amplifica — correr UNA VEZ despues de instalar Node.js
# Abre PowerShell en esta carpeta y ejecuta: .\setup.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CRM Amplifica — Setup inicial" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js no esta instalado. Instala Node 20 LTS desde nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "OK — Node $nodeVersion" -ForegroundColor Green

# 2. Instalar dependencias
Write-Host ""
Write-Host "Instalando dependencias npm..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR en npm install" -ForegroundColor Red; exit 1 }
Write-Host "OK — dependencias instaladas" -ForegroundColor Green

# 3. Verificar .env.local
Write-Host ""
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "ATENCION: Se creo .env.local — debes rellenarlo con tus credenciales antes de continuar" -ForegroundColor Yellow
    Write-Host "  - DATABASE_URL (Supabase)" -ForegroundColor Yellow
    Write-Host "  - GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET" -ForegroundColor Yellow
    Write-Host "  - NEXTAUTH_SECRET (genera uno con: openssl rand -base64 32)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Abre .env.local, completa las variables y vuelve a correr:" -ForegroundColor Cyan
    Write-Host "  npx prisma db push" -ForegroundColor Cyan
    Write-Host "  npm run dev" -ForegroundColor Cyan
    exit 0
}

# 4. Prisma
Write-Host "Generando cliente Prisma..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR en prisma generate" -ForegroundColor Red; exit 1 }
Write-Host "OK" -ForegroundColor Green

Write-Host ""
Write-Host "Sincronizando esquema con la base de datos..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Verifica que DATABASE_URL en .env.local sea correcta" -ForegroundColor Red
    exit 1
}
Write-Host "OK — base de datos lista" -ForegroundColor Green

# 5. Listo!
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Todo listo! Levanta el servidor con:" -ForegroundColor Green
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host "  Luego abre: http://localhost:3000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
