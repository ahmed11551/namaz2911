#!/bin/bash
# Скрипт для тестирования функции daily-azkar-reset

set -e

# Цвета для вывода
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Тестирование функции daily-azkar-reset...${NC}\n"

# Проверка переменных окружения
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}Ошибка: SUPABASE_SERVICE_ROLE_KEY не установлен${NC}"
    echo "Установите переменную: export SUPABASE_SERVICE_ROLE_KEY=your_key"
    exit 1
fi

SUPABASE_URL="${SUPABASE_URL:-https://fvxkywczuqincnjilgzd.supabase.co}"
FUNCTION_URL="${SUPABASE_URL}/functions/v1/daily-azkar-reset"

echo -e "${YELLOW}URL функции: ${FUNCTION_URL}${NC}\n"

# Вызов функции
echo "Вызов функции..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  "${FUNCTION_URL}")

# Разделяем ответ и код статуса
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "\n${YELLOW}HTTP Status Code: ${HTTP_CODE}${NC}"

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Функция выполнена успешно!${NC}\n"
    echo "Ответ:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ Ошибка при выполнении функции${NC}\n"
    echo "Ответ:"
    echo "$BODY"
    exit 1
fi

# Проверка структуры ответа
if echo "$BODY" | jq -e '.message' > /dev/null 2>&1; then
    echo -e "\n${GREEN}✅ Структура ответа корректна${NC}"
    
    RESET_COUNT=$(echo "$BODY" | jq -r '.reset_count // 0')
    TOTAL_USERS=$(echo "$BODY" | jq -r '.total_users // 0')
    
    echo -e "\nСтатистика:"
    echo "  - Всего пользователей: ${TOTAL_USERS}"
    echo "  - Сброшено азкаров: ${RESET_COUNT}"
else
    echo -e "${YELLOW}⚠️  Структура ответа не соответствует ожидаемой${NC}"
fi

echo -e "\n${GREEN}Тестирование завершено${NC}"

