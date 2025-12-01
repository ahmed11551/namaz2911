# PowerShell скрипт для тестирования функции daily-azkar-reset

$ErrorActionPreference = "Stop"

Write-Host "Тестирование функции daily-azkar-reset..." -ForegroundColor Yellow
Write-Host ""

# Проверка переменных окружения
if (-not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "Ошибка: SUPABASE_SERVICE_ROLE_KEY не установлен" -ForegroundColor Red
    Write-Host "Установите переменную: `$env:SUPABASE_SERVICE_ROLE_KEY = 'your_key'"
    exit 1
}

$SUPABASE_URL = if ($env:SUPABASE_URL) { $env:SUPABASE_URL } else { "https://fvxkywczuqincnjilgzd.supabase.co" }
$FUNCTION_URL = "$SUPABASE_URL/functions/v1/daily-azkar-reset"

Write-Host "URL функции: $FUNCTION_URL" -ForegroundColor Yellow
Write-Host ""

# Вызов функции
Write-Host "Вызов функции..."
try {
    $headers = @{
        "Authorization" = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-RestMethod -Uri $FUNCTION_URL -Method Post -Headers $headers -ErrorAction Stop
    
    Write-Host ""
    Write-Host "✅ Функция выполнена успешно!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Ответ:"
    $response | ConvertTo-Json -Depth 10
    
    # Проверка структуры ответа
    if ($response.message) {
        Write-Host ""
        Write-Host "✅ Структура ответа корректна" -ForegroundColor Green
        Write-Host ""
        Write-Host "Статистика:"
        Write-Host "  - Всего пользователей: $($response.total_users)"
        Write-Host "  - Сброшено азкаров: $($response.reset_count)"
    } else {
        Write-Host ""
        Write-Host "⚠️  Структура ответа не соответствует ожидаемой" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Тестирование завершено" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Ошибка при выполнении функции" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

