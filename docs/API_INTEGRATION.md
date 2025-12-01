# Документация интеграции Frontend ↔ Backend

## Архитектура

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│  Supabase Edge  │────▶│   PostgreSQL    │
│   (Frontend)    │     │   Functions     │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                              
         │              ┌─────────────────┐
         └─────────────▶│  e-Replika API  │
                        │  (Islamic Data) │
                        └─────────────────┘
```

---

## 🔌 Конфигурация API

Файл: `src/lib/api.ts`

### Переменные окружения

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://bot.e-replika.ru/api
VITE_USE_SUPABASE_PROXY=false
```

---

## 📋 Список всех API вызовов фронтенда

### 1. Prayer Debt API (`prayerDebtAPI`)

#### Рассчитать долг намазов
```typescript
// Запрос
POST ${SUPABASE_FUNCTIONS_URL}/prayer-debt-api/calculate
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer ${SUPABASE_ANON_KEY}",
  "apikey": "${SUPABASE_ANON_KEY}"
}
Body: {
  user_id: "telegram_user_123",
  birth_date: "1990-01-15",
  prayer_start_date: "2005-01-15",
  gender: "male",
  madhab: "hanafi",
  travel_periods: [
    { start: "2020-03-01", end: "2020-03-15" }
  ]
}

// Ожидаемый ответ (200 OK)
{
  "user_id": "telegram_user_123",
  "debt_calculation": {
    "period": {
      "start": "2005-01-15T00:00:00.000Z",
      "end": "2024-11-29T00:00:00.000Z"
    },
    "missed_prayers": {
      "fajr": 7300,
      "dhuhr": 7300,
      "asr": 7300,
      "maghrib": 7300,
      "isha": 7300,
      "witr": 7300
    },
    "travel_prayers": {
      "fajr": 15,
      "dhuhr": 15,
      "asr": 15,
      "maghrib": 15,
      "isha": 15,
      "witr": 15
    }
  },
  "repayment_progress": {
    "completed_prayers": {
      "fajr": 0,
      "dhuhr": 0,
      "asr": 0,
      "maghrib": 0,
      "isha": 0,
      "witr": 0
    },
    "last_updated": "2024-11-29T12:00:00.000Z"
  }
}

// Ошибка (400/500)
{
  "error": "Invalid date format",
  "code": "VALIDATION_ERROR"
}
```

#### Получить снимок долга
```typescript
// Запрос
GET ${SUPABASE_FUNCTIONS_URL}/prayer-debt-api/snapshot?user_id=telegram_user_123
Headers: { Authorization, apikey }

// Ожидаемый ответ (200 OK)
{
  "user_id": "telegram_user_123",
  "debt_calculation": { ... },
  "repayment_progress": { ... },
  "overall_progress_percent": 15.5,
  "remaining_prayers": {
    "fajr": 6200,
    "dhuhr": 6200,
    ...
  }
}
```

#### Обновить прогресс
```typescript
// Запрос
PATCH ${SUPABASE_FUNCTIONS_URL}/prayer-debt-api/progress
Body: {
  "user_id": "telegram_user_123",
  "entries": [
    { "type": "fajr", "amount": 2, "date": "2024-11-29" },
    { "type": "dhuhr", "amount": 1, "date": "2024-11-29" }
  ]
}

// Ожидаемый ответ (200 OK)
{
  "completed_prayers": {
    "fajr": 102,
    "dhuhr": 51,
    ...
  },
  "last_updated": "2024-11-29T15:30:00.000Z"
}
```

---

### 2. Spiritual Path API (`spiritualPathAPI`)

#### Получить цели
```typescript
// Запрос
GET ${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/goals?status=active
Headers: { Authorization, apikey }

// Ожидаемый ответ (200 OK)
[
  {
    "id": "goal_uuid_123",
    "user_id": "telegram_user_123",
    "title": "Читать 5 страниц Корана",
    "description": "Ежедневное чтение",
    "category": "quran",
    "type": "daily",
    "target_value": 5,
    "current_value": 3,
    "status": "active",
    "start_date": "2024-11-01T00:00:00.000Z",
    "end_date": "2024-12-31T00:00:00.000Z",
    "daily_plan": 5,
    "created_at": "2024-11-01T10:00:00.000Z",
    "updated_at": "2024-11-29T12:00:00.000Z"
  }
]
```

#### Создать цель
```typescript
// Запрос
POST ${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/goals
Body: {
  "user_id": "telegram_user_123",
  "title": "100 раз Субханаллах",
  "category": "zikr",
  "type": "daily",
  "target_value": 100,
  "start_date": "2024-11-29",
  "linked_counter_type": "subhanallah"
}

// Ожидаемый ответ (201 Created)
{
  "id": "goal_uuid_456",
  "user_id": "telegram_user_123",
  "title": "100 раз Субханаллах",
  "category": "zikr",
  "type": "daily",
  "target_value": 100,
  "current_value": 0,
  "status": "active",
  "daily_plan": 100,
  "created_at": "2024-11-29T12:00:00.000Z",
  "updated_at": "2024-11-29T12:00:00.000Z"
}
```

#### Синхронизация счётчика
```typescript
// Запрос
POST ${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/counter/sync
Body: {
  "counter_type": "subhanallah",
  "value": 33,
  "date": "2024-11-29"
}

// Ожидаемый ответ (200 OK)
{
  "success": true,
  "updated_goals": [
    { "goal_id": "goal_uuid_456", "value": 33 }
  ],
  "new_badges": []
}
```

#### Получить бейджи
```typescript
// Запрос
GET ${SUPABASE_FUNCTIONS_URL}/spiritual-path-api/badges

// Ожидаемый ответ (200 OK)
[
  {
    "id": "badge_uuid_123",
    "user_id": "telegram_user_123",
    "badge_type": "prayer_consistency",
    "level": "silver",
    "goal_id": "goal_uuid_456",
    "achieved_at": "2024-11-29T12:00:00.000Z"
  }
]
```

---

### 3. e-Replika API (`eReplikaAPI`)

#### Получить список дуа
```typescript
// Запрос
GET https://bot.e-replika.ru/api/duas
Headers: {
  "Authorization": "Bearer test_token_123"
}

// Ожидаемый ответ (200 OK)
[
  {
    "id": "dua_1",
    "arabic": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    "transcription": "Bismillahir Rahmanir Rahim",
    "translation": "Во имя Аллаха, Милостивого, Милосердного",
    "reference": "Сура Аль-Фатиха",
    "audio_url": "https://bot.e-replika.ru/audio/dua_1.mp3",
    "category": "general"
  }
]

// Ошибка (404)
{
  "error": "Duas endpoint not found"
}
// Фронтенд при 404 возвращает пустой массив []
```

#### Получить аудио дуа
```typescript
// Запрос
GET https://bot.e-replika.ru/api/duas/{dua_id}/audio

// Ожидаемый ответ (200 OK)
Content-Type: audio/mpeg
Binary data...

// Или JSON с URL
{
  "audio_url": "https://cdn.e-replika.ru/audio/dua_1.mp3"
}
```

---

### 4. Smart Tasbih API (`smartTasbihAPI`)

#### Bootstrap (инициализация)
```typescript
// Запрос
GET ${SUPABASE_FUNCTIONS_URL}/smart-tasbih-api/bootstrap

// Ожидаемый ответ (200 OK)
{
  "user": {
    "id": "telegram_user_123",
    "locale": "ru",
    "madhab": "hanafi",
    "tz": "Europe/Moscow"
  },
  "active_goal": null,
  "daily_azkar": {
    "id": "azkar_morning_1",
    "arabic": "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ",
    "translation": "Мы встретили утро и вся власть принадлежит Аллаху"
  },
  "recent_items": []
}
```

#### Фиксация нажатия
```typescript
// Запрос
POST ${SUPABASE_FUNCTIONS_URL}/smart-tasbih-api/counter/tap
Body: {
  "session_id": "session_uuid_123",
  "delta": 1,
  "event_type": "tap"
}

// Ожидаемый ответ (200 OK)
{
  "value_after": 34,
  "goal_progress": {
    "progress": 34,
    "is_completed": false
  },
  "daily_azkar": null
}
```

---

## 🚨 Обработка ошибок на фронтенде

### Текущая реализация (с fallback на localStorage)

```typescript
// src/lib/api.ts - пример обработки
async getSnapshot(): Promise<DebtSnapshot> {
  const userId = getUserId();
  
  // 1. Сначала пробуем API
  try {
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/prayer-debt-api/snapshot?user_id=${userId}`, {
      method: "GET",
      headers: getSupabaseHeaders(),
    });

    if (response.ok) {
      return await response.json();
    }
    
    // Обработка HTTP ошибок
    if (response.status === 401) {
      throw new Error("Не авторизован");
    }
    if (response.status === 404) {
      // Данные не найдены - возвращаем пустой snapshot
      return createEmptySnapshot(userId);
    }
    
    throw new Error(`API Error: ${response.status}`);
  } catch (error) {
    console.warn("Supabase API недоступен:", error);
  }

  // 2. Fallback на localStorage
  return localStorageAPI.getUserData() || createEmptySnapshot(userId);
}
```

### Улучшенная обработка (рекомендуется)

```typescript
// src/lib/error-handler.ts
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json();
  }
  
  let errorData;
  try {
    errorData = await response.json();
  } catch {
    errorData = { error: response.statusText };
  }
  
  throw new APIError(
    errorData.error || 'Неизвестная ошибка',
    errorData.code || 'UNKNOWN_ERROR',
    response.status,
    errorData.details
  );
}
```

---

## 🔄 Текущие Fallback'и (моки)

### Что работает offline:

| Модуль | Fallback | Файл |
|--------|----------|------|
| Каза-намазы | localStorage | `src/lib/api.ts:localStorageAPI` |
| Цели | localStorage | `spiritualPathAPI.getGoalsFromLocalStorage()` |
| Настройки | localStorage | `app_settings` |
| Термины | Hardcoded | `getDefaultTerms()` |

### Что требует backend:

| Модуль | Критичность | Статус |
|--------|-------------|--------|
| Группы целей | Высокая | Требует backend |
| AI отчёты | Средняя | Частично локально |
| Push уведомления | Высокая | Требует backend |
| Бейджи | Средняя | Требует backend |
| Streaks | Средняя | Требует backend |

---

## 📊 Схема базы данных (Supabase)

```sql
-- Таблица целей
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'daily',
  target_value INTEGER NOT NULL DEFAULT 1,
  current_value INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  linked_counter_type TEXT,
  daily_plan NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица прогресса
CREATE TABLE goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица бейджей
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  badge_type TEXT NOT NULL,
  level TEXT NOT NULL,
  goal_id UUID REFERENCES goals(id),
  achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица streaks
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  streak_type TEXT NOT NULL,
  category TEXT,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE
);

-- Индексы
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goal_progress_goal_id ON goal_progress(goal_id);
CREATE INDEX idx_badges_user_id ON badges(user_id);
```

