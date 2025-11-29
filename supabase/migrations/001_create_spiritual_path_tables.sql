-- Миграция для создания таблиц модуля "Мой Духовный Путь"

-- Таблица целей
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('prayer', 'quran', 'zikr', 'sadaqa', 'knowledge', 'names_of_allah')),
  knowledge_subcategory TEXT CHECK (knowledge_subcategory IN ('book', 'alifba', 'tajwid')),
  type TEXT NOT NULL CHECK (type IN ('one_time', 'recurring', 'fixed_term')),
  period TEXT NOT NULL CHECK (period IN ('week', 'month', 'forty_days', 'year', 'custom')),
  metric TEXT NOT NULL CHECK (metric IN ('count', 'regularity')),
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  current_value INTEGER NOT NULL DEFAULT 0 CHECK (current_value >= 0),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  linked_counter_type TEXT CHECK (linked_counter_type IN ('salawat', 'tasbih', 'tahmid', 'takbir', 'names_of_allah')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'overdue')),
  daily_plan NUMERIC(10, 2),
  group_id UUID,
  is_group_goal BOOLEAN DEFAULT FALSE,
  item_id TEXT,
  item_type TEXT CHECK (item_type IN ('dua', 'ayah', 'surah', 'adhkar', 'salawat', 'kalima', 'name_of_allah', 'prayer')),
  item_data JSONB,
  is_learning BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для целей
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_group_id ON goals(group_id);
CREATE INDEX IF NOT EXISTS idx_goals_start_date ON goals(start_date);
CREATE INDEX IF NOT EXISTS idx_goals_end_date ON goals(end_date);

-- Таблица прогресса целей
CREATE TABLE IF NOT EXISTS goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  value INTEGER NOT NULL DEFAULT 0 CHECK (value >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(goal_id, user_id, date)
);

-- Индексы для прогресса
CREATE INDEX IF NOT EXISTS idx_goal_progress_goal_id ON goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_user_id ON goal_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_date ON goal_progress(date);

-- Таблица бейджей
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  badge_type TEXT NOT NULL CHECK (badge_type IN ('prayer_consistency', 'quran_completion', 'sadaqa_regularity', 'zikr_consistency', 'streak_master', 'goal_achiever')),
  level TEXT NOT NULL CHECK (level IN ('copper', 'silver', 'gold')),
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  UNIQUE(user_id, badge_type, level)
);

-- Индексы для бейджей
CREATE INDEX IF NOT EXISTS idx_badges_user_id ON badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_badge_type ON badges(badge_type);

-- Таблица серий (streaks)
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  streak_type TEXT NOT NULL CHECK (streak_type IN ('daily_all', 'category')),
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date DATE NOT NULL,
  category TEXT CHECK (category IN ('prayer', 'quran', 'zikr', 'sadaqa', 'knowledge', 'names_of_allah')),
  UNIQUE(user_id, streak_type, category)
);

-- Индексы для streaks
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_streaks_type ON streaks(streak_type);

-- Таблица групп целей
CREATE TABLE IF NOT EXISTS goal_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для групп
CREATE INDEX IF NOT EXISTS idx_goal_groups_goal_id ON goal_groups(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_groups_created_by ON goal_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_goal_groups_invite_code ON goal_groups(invite_code);

-- Таблица участников групп
CREATE TABLE IF NOT EXISTS goal_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES goal_groups(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress_contribution INTEGER NOT NULL DEFAULT 0 CHECK (progress_contribution >= 0),
  UNIQUE(group_id, user_id)
);

-- Индексы для участников групп
CREATE INDEX IF NOT EXISTS idx_goal_group_members_group_id ON goal_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_goal_group_members_user_id ON goal_group_members(user_id);

-- Таблица AI отчетов
CREATE TABLE IF NOT EXISTS ai_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'custom')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  predictions JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для AI отчетов
CREATE INDEX IF NOT EXISTS idx_ai_reports_user_id ON ai_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_reports_generated_at ON ai_reports(generated_at);

-- Таблица настроек уведомлений
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  telegram_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notification_period_start TIME,
  notification_period_end TIME,
  daily_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  motivation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  badge_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goal_groups_updated_at
  BEFORE UPDATE ON goal_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Функция для автоматического расчета current_value из goal_progress
CREATE OR REPLACE FUNCTION update_goal_current_value()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE goals
  SET current_value = (
    SELECT COALESCE(SUM(value), 0)
    FROM goal_progress
    WHERE goal_id = COALESCE(NEW.goal_id, OLD.goal_id)
  )
  WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления current_value
CREATE TRIGGER update_goal_current_value_on_insert
  AFTER INSERT ON goal_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_current_value();

CREATE TRIGGER update_goal_current_value_on_update
  AFTER UPDATE ON goal_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_current_value();

CREATE TRIGGER update_goal_current_value_on_delete
  AFTER DELETE ON goal_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_current_value();


