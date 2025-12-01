#!/bin/bash
# Скрипт для автоматической настройки Telegram бота
# Использование: bash scripts/setup-bot.sh

echo "🤖 Настройка Telegram бота для Mini App"
echo ""

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "Создаю .env файл..."
    
    cat > .env << 'EOF'
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
EOF
    
    echo "✅ Файл .env создан"
else
    echo "✅ Файл .env уже существует"
fi

# Проверка токена
if grep -q "TELEGRAM_BOT_TOKEN=" .env; then
    TOKEN=$(grep "TELEGRAM_BOT_TOKEN=" .env | cut -d'=' -f2)
    echo "✅ Токен бота найден: ${TOKEN:0:10}..."
else
    echo "⚠️  Токен бота не найден в .env"
fi

# Проверка URL
if grep -q "WEB_APP_URL=" .env; then
    WEB_APP_URL=$(grep "WEB_APP_URL=" .env | cut -d'=' -f2)
    echo "✅ Web App URL: $WEB_APP_URL"
else
    echo "⚠️  Web App URL не найден"
fi

echo ""
echo "📋 Следующие шаги:"
echo "1. Откройте @BotFather в Telegram: https://t.me/BotFather"
echo "2. Отправьте команду: /setmenubutton"
echo "3. Выберите вашего бота"
echo "4. Выберите: Configure menu button"
echo "5. Выберите: Web App"
echo "6. Введите URL: $WEB_APP_URL"
echo "7. Введите текст кнопки: 🕌 Открыть приложение"
echo ""
echo "✅ Настройка завершена!"

