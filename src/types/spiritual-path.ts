// Типы для модуля "Мой Духовный Путь"

export type GoalCategory = 
  | "prayer" // Намаз
  | "quran" // Коран
  | "zikr" // Зикр/Дуа
  | "sadaqa" // Садака
  | "knowledge" // Знания
  | "names_of_allah"; // 99 имен Аллаха

export type GoalType = 
  | "one_time" // Одноразовая
  | "recurring" // Повторяющаяся (автоматически возобновляется)
  | "fixed_term" // С фиксированным сроком
  | "habit"; // Бессрочная привычка

export type GoalPeriod = 
  | "infinite" // Бессрочная привычка
  | "week" // Неделя
  | "month" // Месяц
  | "forty_days" // 40 дней
  | "year" // Год
  | "custom" // К определенной дате
  | "recurring_weekly" // Повторяющаяся еженедельно
  | "recurring_monthly"; // Повторяющаяся ежемесячно

export type GoalMetric = 
  | "count" // Количество (раз, страниц, сур)
  | "regularity"; // Регулярность (дни подряд)

export type GoalStatus = 
  | "active" 
  | "paused" 
  | "completed"
  | "overdue";

export type LinkedCounterType = 
  | "salawat" // Салаваты
  | "tasbih" // Тасбих (Субханаллах)
  | "tahmid" // Тахмид (Альхамдулиллах)
  | "takbir" // Такбир (Аллаху Акбар)
  | "names_of_allah" // 99 имен Аллаха
  | null;

export type KnowledgeSubcategory = 
  | "book" // Книга
  | "alifba" // Уроки алифба
  | "tajwid"; // Таджвид

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: GoalCategory;
  knowledge_subcategory?: KnowledgeSubcategory; // Для категории "knowledge"
  type: GoalType;
  period: GoalPeriod;
  metric: GoalMetric;
  target_value: number; // Целевое значение
  current_value: number; // Текущее значение
  start_date: Date;
  end_date?: Date; // Для fixed_term и custom period
  linked_counter_type?: LinkedCounterType; // Для интеграции с тасбихом
  status: GoalStatus;
  daily_plan?: number; // Рекомендуемый ежедневный план
  created_at: Date;
  updated_at: Date;
  // Для групповых целей
  group_id?: string;
  is_group_goal?: boolean;
  // Для связи с конкретными элементами
  item_id?: string; // ID конкретного дуа, аята, зикра и т.д.
  item_type?: "dua" | "ayah" | "surah" | "adhkar" | "salawat" | "kalima" | "name_of_allah";
  // Флаг "Выучить"
  is_learning?: boolean; // Если true, показываем кнопку "Выучил"
  // Данные для отображения (кэшируются при создании цели)
  item_data?: {
    arabic?: string;
    transcription?: string;
    russianTranscription?: string;
    translation?: string;
    audioUrl?: string | null;
    reference?: string;
  };
}

export interface GoalProgress {
  id: string;
  goal_id: string;
  user_id: string;
  date: Date;
  value: number; // Значение за день
  notes?: string;
  created_at: Date;
}

export interface Badge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  level: BadgeLevel;
  achieved_at: Date;
  goal_id?: string; // Связь с целью, если бейдж получен за цель
}

export type BadgeType = 
  | "prayer_consistency" // Неуклонный в намазе
  | "quran_completion" // Сердце Корана
  | "sadaqa_regularity" // Рука щедрости
  | "zikr_consistency" // Сахих
  | "streak_master" // Мастер серий
  | "goal_achiever"; // Достигатель целей

export type BadgeLevel = 
  | "copper" // Медь
  | "silver" // Серебро
  | "gold"; // Золото

export interface Streak {
  id: string;
  user_id: string;
  streak_type: StreakType;
  current_streak: number; // Текущая серия
  longest_streak: number; // Самая длинная серия
  last_activity_date: Date;
  category?: GoalCategory; // Для категорийных streaks
}

export type StreakType = 
  | "daily_all" // Daily Streak (выполнение всех ежедневных целей)
  | "category"; // Категорийные Streaks

export interface GoalGroup {
  id: string;
  name: string;
  goal_id: string;
  created_by: string;
  invite_code: string; // Уникальный код для приглашения
  created_at: Date;
  updated_at: Date;
}

export interface GoalGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: Date;
  progress_contribution: number; // Вклад пользователя в общий прогресс
}

export interface QazaCalculation {
  mode: "manual" | "auto";
  // Для ручного режима
  manual_count?: number;
  // Для авторасчета
  gender?: "male" | "female";
  birth_date?: Date;
  prayer_start_date?: Date;
  travel_periods?: Array<{
    start_date: Date;
    end_date: Date;
  }>;
  // Результат
  total_debt?: number;
  debt_map?: Record<string, "debt" | "completed" | "none">; // Карта долга по датам
}

export interface AIReport {
  id: string;
  user_id: string;
  report_type: "weekly" | "monthly" | "custom";
  period_start: Date;
  period_end: Date;
  insights: AIInsight[];
  recommendations?: string[]; // Для PRO тарифа
  predictions?: AIPrediction[]; // Для Premium тарифа
  generated_at: Date;
}

export interface AIInsight {
  type: "achievement" | "trend" | "warning" | "motivation";
  title: string;
  description: string;
  metric?: string;
  value?: number;
}

export interface AIPrediction {
  metric: string;
  predicted_value: number;
  confidence: number; // 0-100
  timeframe: string;
}

export type PushSubscriptionStatus =
  | "not_supported"
  | "inactive"
  | "permission_denied"
  | "subscribed"
  | "vapid_missing"
  | "error";

export interface NotificationSettings {
  user_id: string;
  enabled: boolean;
  telegram_enabled: boolean;
  notification_period_start?: string; // "08:00"
  notification_period_end?: string; // "22:00"
  daily_reminder_enabled: boolean;
  motivation_enabled: boolean;
  badge_notifications_enabled: boolean;
  push_enabled?: boolean;
  push_subscription_status?: PushSubscriptionStatus;
  last_push_check?: string;
  device_platform?: string;
  telegram_chat_id?: string | null;
}

export interface SmartNotification {
  id: string;
  user_id: string;
  goal_id?: string;
  type: "reminder" | "motivation" | "congratulations" | "warning";
  title: string;
  message: string;
  personalized_message: string; // С персонализацией имени
  sent_at?: Date;
  scheduled_for?: Date;
}


