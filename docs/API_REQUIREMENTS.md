# Требования к Backend API для Владимира

## Обзор

Фронтенд использует два типа API:
1. **Supabase Edge Functions** - основной backend (уже реализован частично)
2. **e-Replika API** - внешний API для исламского контента (https://bot.e-replika.ru/docs)

---

## 🔴 КРИТИЧНО: Требуемые эндпоинты (отсутствуют или неполные)

### 1. Модуль "Время намазов"

```
GET /api/prayer-times
Query: city={city_name}&date={YYYY-MM-DD}&method={calculation_method}
Response: {
  fajr: "04:30",
  sunrise: "06:00", 
  dhuhr: "12:30",
  asr: "14:45",
  maghrib: "17:15",
  isha: "19:00",
  hijri_date: { day: 15, month: 6, year: 1446 }
}
```

### 2. Модуль "Каза-намазы" (Prayer Debt)

```
POST /api/prayer-debt/calculate
Body: {
  user_id: string,
  birth_date: "YYYY-MM-DD",
  prayer_start_date: "YYYY-MM-DD",
  gender: "male" | "female",
  madhab: "hanafi" | "shafii" | "maliki" | "hanbali",
  travel_periods: [{ start: "YYYY-MM-DD", end: "YYYY-MM-DD" }],
  menstruation_days_per_month?: number, // для женщин
  postnatal_days?: number // для женщин
}
Response: {
  user_id: string,
  debt_calculation: {
    period: { start: "YYYY-MM-DD", end: "YYYY-MM-DD" },
    missed_prayers: { fajr: number, dhuhr: number, asr: number, maghrib: number, isha: number, witr: number },
    travel_prayers: { fajr: number, dhuhr: number, asr: number, maghrib: number, isha: number, witr: number }
  },
  repayment_progress: {
    completed_prayers: { fajr: number, dhuhr: number, asr: number, maghrib: number, isha: number, witr: number },
    last_updated: "ISO8601"
  }
}
```

```
GET /api/prayer-debt/snapshot?user_id={user_id}
Response: DebtSnapshot (см. выше)
```

```
PATCH /api/prayer-debt/progress
Body: {
  user_id: string,
  entries: [{ type: "fajr" | "dhuhr" | ..., amount: number, date: "YYYY-MM-DD" }]
}
Response: RepaymentProgress
```

### 3. Модуль "Духовный путь" (Spiritual Path)

```
GET /api/goals?user_id={user_id}&status={active|completed|all}
Response: Goal[]
```

```
POST /api/goals
Body: {
  user_id: string,
  title: string,
  description?: string,
  category: "prayer" | "quran" | "zikr" | "knowledge" | "charity" | "fasting",
  type: "daily" | "weekly" | "monthly" | "once",
  target_value: number,
  start_date: "YYYY-MM-DD",
  end_date?: "YYYY-MM-DD",
  linked_counter_type?: string
}
Response: Goal
```

```
PUT /api/goals/{goal_id}
Body: Partial<Goal>
Response: Goal
```

```
DELETE /api/goals/{goal_id}
Response: { success: boolean }
```

```
POST /api/goals/{goal_id}/progress
Body: { value: number, date: "YYYY-MM-DD", notes?: string }
Response: GoalProgress
```

### 4. Модуль "Тасбих" (Smart Tasbih)

```
POST /api/tasbih/sessions/start
Body: {
  user_id: string,
  category: string,
  item_id?: string,
  goal_id?: string
}
Response: TasbihSession
```

```
POST /api/tasbih/counter/tap
Body: {
  session_id: string,
  delta: number,
  event_type: "tap" | "shake" | "voice"
}
Response: {
  value_after: number,
  goal_progress?: { progress: number, is_completed: boolean }
}
```

### 5. Модуль "Уведомления"

```
GET /api/notifications/settings?user_id={user_id}
Response: NotificationSettings
```

```
PUT /api/notifications/settings
Body: NotificationSettings
Response: NotificationSettings
```

```
POST /api/notifications/push-subscription
Body: {
  user_id: string,
  subscription: PushSubscriptionJSON,
  platform: string
}
Response: { success: boolean }
```

### 6. Исламский контент (дуа, азкары, Коран)

```
GET /api/duas
Response: Dua[]

GET /api/duas/{dua_id}
Response: Dua

GET /api/duas/{dua_id}/audio
Response: { audio_url: string } | audio/mpeg binary

GET /api/adhkar
Response: Adhkar[]

GET /api/salawat
Response: Salawat[]

GET /api/kalimas
Response: Kalima[]

GET /api/quran/surahs
Response: Surah[]

GET /api/quran/ayahs?surah={number}&ayah={number}
Response: Ayah[]

GET /api/names-of-allah
Response: NameOfAllah[]
```

### 7. Календарь Хиджры

```
POST /api/calendar/convert-to-hijri
Body: { date: "YYYY-MM-DD" }
Response: { year: number, month: number, day: number }

POST /api/calendar/convert-from-hijri
Body: { year: number, month: number, day: number }
Response: { date: "YYYY-MM-DD" }
```

---

## 📊 Типы данных

### Goal
```typescript
interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: "prayer" | "quran" | "zikr" | "knowledge" | "charity" | "fasting";
  type: "daily" | "weekly" | "monthly" | "once";
  target_value: number;
  current_value: number;
  start_date: Date;
  end_date?: Date;
  status: "active" | "completed" | "paused" | "cancelled";
  linked_counter_type?: string;
  daily_plan?: number;
  created_at: Date;
  updated_at: Date;
}
```

### Dua
```typescript
interface Dua {
  id: string;
  arabic: string;
  transcription: string;
  russianTranscription?: string;
  translation: string;
  reference?: string;
  audioUrl?: string;
  category?: string;
}
```

### NotificationSettings
```typescript
interface NotificationSettings {
  user_id: string;
  enabled: boolean;
  telegram_enabled: boolean;
  notification_period_start: string; // "HH:MM"
  notification_period_end: string;   // "HH:MM"
  daily_reminder_enabled: boolean;
  motivation_enabled: boolean;
  badge_notifications_enabled: boolean;
  push_enabled: boolean;
}
```

---

## 🔐 Авторизация

Все запросы должны содержать заголовок:
```
Authorization: Bearer {telegram_init_data | user_token}
```

Для Telegram Mini App используется `initData` из `window.Telegram.WebApp.initData`.

---

## ⚠️ Обработка ошибок

Все ошибки должны возвращаться в формате:
```json
{
  "error": "Описание ошибки",
  "code": "ERROR_CODE",
  "details": {}
}
```

HTTP коды:
- 400 - Неверный запрос
- 401 - Не авторизован
- 403 - Доступ запрещён
- 404 - Не найдено
- 500 - Внутренняя ошибка сервера

---

## 📝 Примечания

1. Все даты в формате ISO 8601 (YYYY-MM-DD или YYYY-MM-DDTHH:mm:ssZ)
2. Все ID в формате UUID v4
3. Пагинация: `?page=1&limit=20`
4. Сортировка: `?sort=created_at&order=desc`

