#!/bin/bash
# ===========================================
# Namaz2911 - Скрипт запуска Docker (Linux/Mac)
# ===========================================
# Использование: ./scripts/docker-start.sh
# ===========================================

echo "🕌 Namaz2911 - Запуск Docker контейнера"

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    echo "Установите Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Проверяем запущен ли Docker
if ! docker info &> /dev/null; then
    echo "❌ Docker не запущен!"
    echo "Запустите Docker и попробуйте снова."
    exit 1
fi

# Устанавливаем переменные окружения по умолчанию
export PORT="${PORT:-3000}"
export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-https://fvxkywczuqincnjilgzd.supabase.co}"
export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgwNTYsImV4cCI6MjA3NzkyNDA1Nn0.jBvLDl0T2u-slvf4Uu4oZj7yRWMQCKmiln0mXRU0q54}"
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://bot.e-replika.ru/api}"

echo "📦 Сборка и запуск контейнера..."

# Запускаем docker-compose
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Приложение запущено!"
    echo "🌐 Откройте: http://localhost:${PORT}"
    echo ""
    echo "Полезные команды:"
    echo "  docker-compose logs -f     # Просмотр логов"
    echo "  docker-compose down        # Остановка"
    echo "  docker-compose restart     # Перезапуск"
else
    echo "❌ Ошибка при запуске!"
    echo "Проверьте логи: docker-compose logs"
    exit 1
fi

