#!/bin/bash
# ===========================================
# Namaz2911 - Скрипт создания .env файла
# ===========================================

ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
    echo "⚠️  Файл .env уже существует. Перезаписать? (y/n)"
    read -r answer
    if [ "$answer" != "y" ]; then
        echo "Отменено."
        exit 0
    fi
fi

cat > "$ENV_FILE" << 'EOF'
# ===========================================
# Namaz2911 - Переменные окружения
# ===========================================

# Порт для запуска приложения
PORT=3000

# Supabase конфигурация
VITE_SUPABASE_URL=https://fvxkywczuqincnjilgzd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2eGt5d2N6dXFpbmNuamlsZ3pkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNDgwNTYsImV4cCI6MjA3NzkyNDA1Nn0.jBvLDl0T2u-slvf4Uu4oZj7yRWMQCKmiln0mXRU0q54

# e-Replika API (исламский контент)
VITE_API_BASE_URL=https://bot.e-replika.ru/api

# Опционально: прокси через Supabase Edge Functions
VITE_USE_SUPABASE_PROXY=false
EOF

echo "✅ Файл .env создан!"
echo "📝 Отредактируйте его при необходимости: nano .env"

