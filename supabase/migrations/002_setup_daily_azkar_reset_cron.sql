-- Миграция для настройки cron job для ежедневного сброса азкаров
-- ВАЖНО: Эта миграция требует расширения pg_cron в Supabase
-- Если pg_cron недоступен, используйте внешний cron service (см. README.md)

-- Проверяем наличие расширения pg_cron
DO $$
BEGIN
  -- Проверяем, установлено ли расширение pg_cron
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Удаляем существующую задачу, если она есть
    PERFORM cron.unschedule('daily-azkar-reset');
    
    -- Создаем новую задачу для вызова функции каждые 5 минут
    -- Замените YOUR_PROJECT и YOUR_SERVICE_ROLE_KEY на реальные значения
    PERFORM cron.schedule(
      'daily-azkar-reset',
      '*/5 * * * *', -- каждые 5 минут
      $$
      SELECT net.http_post(
        url := 'https://fvxkywczuqincnjilgzd.supabase.co/functions/v1/daily-azkar-reset',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        )
      );
      $$
    );
    
    RAISE NOTICE 'Cron job "daily-azkar-reset" успешно создан';
  ELSE
    RAISE NOTICE 'Расширение pg_cron не установлено. Используйте внешний cron service (см. README.md)';
  END IF;
END $$;

-- Альтернативный вариант: если используется переменная окружения напрямую
-- Раскомментируйте и замените YOUR_SERVICE_ROLE_KEY на реальный ключ
/*
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('daily-azkar-reset');
    
    PERFORM cron.schedule(
      'daily-azkar-reset',
      '*/5 * * * *',
      $$
      SELECT net.http_post(
        url := 'https://fvxkywczuqincnjilgzd.supabase.co/functions/v1/daily-azkar-reset',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
        )
      );
      $$
    );
  END IF;
END $$;
*/

