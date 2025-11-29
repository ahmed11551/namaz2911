# Daily Azkar Reset Function

Edge Function для ежедневного сброса прогресса азкаров в 00:00 по локальному времени каждого пользователя.

## Описание

Эта функция автоматически создает новую запись `daily_azkar` для каждого пользователя, когда в его часовом поясе наступает 00:00. Функция проверяет всех пользователей и сбрасывает азкары только для тех, у кого сейчас полночь (00:00-00:05).

## Настройка Cron Job

### Вариант 1: Supabase Cron (pg_cron)

Если у вас есть доступ к pg_cron в Supabase, создайте задачу:

```sql
-- Вызывать функцию каждые 5 минут
SELECT cron.schedule(
  'daily-azkar-reset',
  '*/5 * * * *', -- каждые 5 минут
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/daily-azkar-reset',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    )
  );
  $$
);
```

### Вариант 2: Внешний Cron Service

Используйте внешний сервис (например, cron-job.org, EasyCron) для вызова функции:

- **URL**: `https://YOUR_PROJECT.supabase.co/functions/v1/daily-azkar-reset`
- **Method**: POST
- **Headers**:
  - `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
  - `Content-Type: application/json`
- **Schedule**: Каждые 5 минут (`*/5 * * * *`)

### Вариант 3: GitHub Actions / CI/CD

Создайте GitHub Action для периодического вызова:

```yaml
name: Daily Azkar Reset
on:
  schedule:
    - cron: '*/5 * * * *' # каждые 5 минут
jobs:
  reset:
    runs-on: ubuntu-latest
    steps:
      - name: Call Reset Function
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            https://YOUR_PROJECT.supabase.co/functions/v1/daily-azkar-reset
```

## Переменные окружения

Убедитесь, что в настройках Edge Function установлены:

- `SUPABASE_URL` - URL вашего Supabase проекта
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key для доступа ко всем данным
- `CRON_SECRET` (опционально) - секретный ключ для дополнительной защиты

## Логика работы

1. Функция получает всех пользователей из таблицы `users`
2. Для каждого пользователя проверяется его часовой пояс (`tz`)
3. Если в часовом поясе пользователя сейчас 00:00-00:05, создается новая запись `daily_azkar`
4. Если запись на сегодня уже существует, она пропускается

## Безопасность

Функция использует Service Role Key для доступа ко всем данным. Убедитесь, что:

1. Service Role Key хранится в секретах и не попадает в публичный репозиторий
2. Если используется `CRON_SECRET`, он должен совпадать в запросе и в переменных окружения
3. Функция вызывается только из доверенных источников (cron jobs, CI/CD)

## Мониторинг

Функция возвращает JSON с результатами:

```json
{
  "message": "Daily azkar reset completed",
  "reset_count": 5,
  "total_users": 100,
  "results": [
    {
      "user_id": "...",
      "status": "reset",
      "tz": "Europe/Moscow"
    }
  ]
}
```

Проверяйте логи в Supabase Dashboard для отслеживания работы функции.

