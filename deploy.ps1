# PowerShell скрипт для деплоя в Vercel

$VERCEL_TOKEN = "ifSZtWOrnBKyoJH6qa9YXJyz"
$PROJECT_ID = "prj_genQ6ker04s6cosntyWcxqYXfxSM"

Write-Host "🚀 Начинаю деплой в Vercel..." -ForegroundColor Green

# Проверка подключения
Write-Host "`n📡 Проверка подключения..." -ForegroundColor Yellow
$whoami = npx vercel@latest whoami --token $VERCEL_TOKEN 2>&1
Write-Host $whoami

# Подключение проекта
Write-Host "`n🔗 Подключение проекта..." -ForegroundColor Yellow
npx vercel@latest link --token $VERCEL_TOKEN --project $PROJECT_ID --yes 2>&1

# Деплой
Write-Host "`n📦 Запуск деплоя в продакшен..." -ForegroundColor Yellow
$deploy = npx vercel@latest --token $VERCEL_TOKEN --prod --yes 2>&1
Write-Host $deploy

Write-Host "`n✅ Деплой завершен!" -ForegroundColor Green

