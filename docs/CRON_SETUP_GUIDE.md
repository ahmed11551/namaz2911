# Руководство по настройке Cron Job для Daily Azkar Reset

## Обзор

Функция `daily-azkar-reset` должна вызываться каждые 5 минут для сброса ежедневных азкаров пользователей в 00:00 по их локальному времени.

## Варианты настройки

### Вариант 1: GitHub Actions (Рекомендуется) ✅

**Статус:** ✅ Настроено

Файл: `.github/workflows/daily-azkar-reset.yml`

**Что нужно сделать:**
1. Перейти в Settings → Secrets and variables → Actions
2. Добавить секреты:
   - `SUPABASE_URL`: `https://fvxkywczuqincnjilgzd.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: ваш Service Role Key из Supabase Dashboard

**Преимущества:**
- Бесплатно
- Надежно
- Легко настроить
- Автоматический запуск каждые 5 минут

---

### Вариант 2: Supabase pg_cron (Если доступен)

**Статус:** ⚠️ Требует настройки в Supabase

**Что нужно сделать:**
1. Открыть Supabase Dashboard → SQL Editor
2. Выполнить миграцию: `supabase/migrations/002_setup_daily_azkar_reset_cron.sql`
3. Заменить `YOUR_SERVICE_ROLE_KEY` на реальный ключ

**Примечание:** pg_cron доступен не во всех планах Supabase.

---

### Вариант 3: Внешний Cron Service

**Статус:** ⚠️ Требует настройки

**Рекомендуемые сервисы:**
- [cron-job.org](https://cron-job.org) (бесплатно)
- [EasyCron](https://www.easycron.com) (бесплатный план)
- [UptimeRobot](https://uptimerobot.com) (бесплатно)

**Настройки:**
- **URL**: `https://fvxkywczuqincnjilgzd.supabase.co/functions/v1/daily-azkar-reset`
- **Method**: POST
- **Headers**:
  ```
  Authorization: Bearer YOUR_SERVICE_ROLE_KEY
  Content-Type: application/json
  ```
- **Schedule**: `*/5 * * * *` (каждые 5 минут)

---

## Проверка работы

### 1. Проверка через Supabase Dashboard

1. Откройте Supabase Dashboard → Edge Functions → `daily-azkar-reset`
2. Проверьте логи выполнения
3. Должны быть записи каждые 5 минут

### 2. Ручной тест

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  https://fvxkywczuqincnjilgzd.supabase.co/functions/v1/daily-azkar-reset
```

**Ожидаемый ответ:**
```json
{
  "message": "Daily azkar reset completed",
  "reset_count": 0,
  "total_users": 10,
  "results": [...]
}
```

### 3. Проверка в базе данных

```sql
-- Проверка последних записей daily_azkar
SELECT 
  user_id,
  date_local,
  total,
  is_complete,
  updated_at
FROM daily_azkar
ORDER BY updated_at DESC
LIMIT 10;
```

---

## Мониторинг

### Логи GitHub Actions

1. Перейти в GitHub → Actions
2. Найти workflow "Daily Azkar Reset"
3. Проверить последние запуски

### Логи Supabase

1. Supabase Dashboard → Edge Functions → `daily-azkar-reset` → Logs
2. Проверить успешные выполнения и ошибки

---

## Устранение неполадок

### Проблема: Cron job не запускается

**Решение:**
1. Проверить, что секреты добавлены в GitHub Actions
2. Проверить расписание cron (должно быть `*/5 * * * *`)
3. Проверить логи в GitHub Actions

### Проблема: Функция возвращает ошибку 401

**Решение:**
1. Проверить, что `SUPABASE_SERVICE_ROLE_KEY` правильный
2. Проверить формат заголовка: `Bearer YOUR_KEY`

### Проблема: Азкары не сбрасываются

**Решение:**
1. Проверить, что у пользователей установлен часовой пояс (`users.tz`)
2. Проверить логи функции на наличие ошибок
3. Убедиться, что функция вызывается в период 00:00-00:05 по локальному времени

---

## Текущий статус

✅ **GitHub Actions workflow создан**  
⚠️ **Требуется добавить секреты в GitHub**  
⚠️ **Требуется проверить работу в production**

---

## Следующие шаги

1. ✅ Создать GitHub Actions workflow
2. ⚠️ Добавить секреты в GitHub (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
3. ⚠️ Протестировать первый запуск
4. ⚠️ Проверить логи и результаты

