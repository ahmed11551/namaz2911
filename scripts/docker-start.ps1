# ===========================================
# Namaz2911 - Скрипт запуска Docker (Windows)
# ===========================================
# Использование: .\scripts\docker-start.ps1
# ===========================================

Write-Host "🕌 Namaz2911 - Запуск Docker контейнера" -ForegroundColor Cyan

# Проверяем наличие Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker не установлен!" -ForegroundColor Red
    Write-Host "Установите Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Проверяем запущен ли Docker
$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker не запущен!" -ForegroundColor Red
    Write-Host "Запустите Docker Desktop и попробуйте снова." -ForegroundColor Yellow
    exit 1
}

# Устанавливаем переменные окружения по умолчанию
$env:PORT = if ($env:PORT) { $env:PORT } else { "3000" }
$env:VITE_SUPABASE_URL = if ($env:VITE_SUPABASE_URL) { $env:VITE_SUPABASE_URL } else { "https://fvxkywczuqincnjilgzd.supabase.co" }
$env:VITE_SUPABASE_ANON_KEY = if ($env:VITE_SUPABASE_ANON_KEY) { $env:VITE_SUPABASE_ANON_KEY } else { "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgwNTYsImV4cCI6MjA3NzkyNDA1Nn0.jBvLDl0T2u-slvf4Uu4oZj7yRWMQCKmiln0mXRU0q54" }
$env:VITE_API_BASE_URL = if ($env:VITE_API_BASE_URL) { $env:VITE_API_BASE_URL } else { "https://bot.e-replika.ru/api" }

Write-Host "📦 Сборка и запуск контейнера..." -ForegroundColor Green

# Запускаем docker-compose
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Приложение запущено!" -ForegroundColor Green
    Write-Host "🌐 Откройте: http://localhost:$($env:PORT)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Полезные команды:" -ForegroundColor Yellow
    Write-Host "  docker-compose logs -f     # Просмотр логов"
    Write-Host "  docker-compose down        # Остановка"
    Write-Host "  docker-compose restart     # Перезапуск"
} else {
    Write-Host "❌ Ошибка при запуске!" -ForegroundColor Red
    Write-Host "Проверьте логи: docker-compose logs" -ForegroundColor Yellow
    exit 1
}

