# Скрипт для автоматической настройки Telegram бота
# Использование: .\scripts\setup-bot.ps1

Write-Host "🤖 Настройка Telegram бота для Mini App" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия .env файла
if (-not (Test-Path .env)) {
    Write-Host "❌ Файл .env не найден!" -ForegroundColor Red
    Write-Host "Создаю .env файл..." -ForegroundColor Yellow
    
    $envContent = @"
# Telegram Bot Token
TELEGRAM_BOT_TOKEN=8352964722:AAHAfW5Hi8gAY1-uHeAO0T2KPzdwk3vWt-8

# API Configuration
VITE_API_BASE_URL=https://bot.e-replika.ru/api
VITE_INTERNAL_API_URL=/api
VITE_API_TOKEN=test_token_123

# Supabase Configuration
VITE_SUPABASE_URL=https://fvxkywczuqincnjilgzd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgwNTYsImV4cCI6MjA3NzkyNDA1Nn0.jBvLDl0T2u-slvf4Uu4oZj7yRWMQCKmiln0mXRU0q54

# Web App URL
WEB_APP_URL=https://namaz2911.vercel.app
"@
    
    $envContent | Out-File -FilePath .env -Encoding utf8
    Write-Host "✅ Файл .env создан" -ForegroundColor Green
} else {
    Write-Host "✅ Файл .env уже существует" -ForegroundColor Green
}

# Проверка токена
$envContent = Get-Content .env -Raw
if ($envContent -match "TELEGRAM_BOT_TOKEN=(\d+:[A-Za-z0-9_-]+)") {
    $token = $matches[1]
    Write-Host "✅ Токен бота найден: $($token.Substring(0, 10))..." -ForegroundColor Green
} else {
    Write-Host "⚠️  Токен бота не найден в .env" -ForegroundColor Yellow
}

# Проверка URL
if ($envContent -match "WEB_APP_URL=(.+)") {
    $webAppUrl = $matches[1].Trim()
    Write-Host "✅ Web App URL: $webAppUrl" -ForegroundColor Green
} else {
    Write-Host "⚠️  Web App URL не найден" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Следующие шаги:" -ForegroundColor Cyan
Write-Host "1. Откройте @BotFather в Telegram: https://t.me/BotFather" -ForegroundColor White
Write-Host "2. Отправьте команду: /setmenubutton" -ForegroundColor White
Write-Host "3. Выберите вашего бота" -ForegroundColor White
Write-Host "4. Выберите: Configure menu button" -ForegroundColor White
Write-Host "5. Выберите: Web App" -ForegroundColor White
Write-Host "6. Введите URL: $webAppUrl" -ForegroundColor White
Write-Host "7. Введите текст кнопки: 🕌 Открыть приложение" -ForegroundColor White
Write-Host ""
Write-Host "✅ Настройка завершена!" -ForegroundColor Green

