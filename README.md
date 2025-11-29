# Трекер намазов - Prayer-Debt

Telegram Mini App для расчета и отслеживания восполнения пропущенных обязательных намазов по ханафитскому мазхабу.

## Основные функции

### Пропущенные намазы (Каза)
- **Расчёт долга** - автоматический расчет пропущенных намазов с момента булюга
- **Прогресс** - отслеживание восполнения по каждому намазу
- **AI-план** - персональные рекомендации для эффективного восполнения
- **Сафар-намазы** - отдельный трекинг сокращенных намазов в путешествиях
- **Отчёты** - детальная статистика и PDF отчеты
- **Цели** - система целей и привычек с автоматическим созданием
- **Календарь** - визуальный календарь с отслеживанием по дням

### Зикры
- **Дуа** - 9 категорий, 26 мольб (перед сном, после намаза, в хадже и т.д.)
- **Азкары** - 5 категорий, 13 поминаний с счетчиками
- **Салаваты** - благословения на Пророка Мухаммада ﷺ
- **Калимы** - все 6 основополагающих формул веры
- **Focus-ритуалы** - уникальные связки тасбиха, дыхания и намерений с журналом состояний и авто-дзикром

### Главный дашборд
- **Обзор** - единый экран прогресса по намазам, постам, привычкам и срочным целям
- **Аналитика** - подсказки по streak’ам, ближайшим дедлайнам и “фокусам дня”
- **Инсайты** - рекомендации по следующим шагам и карточки состояния модулей
- **Привычки** - streak 2.0 со skip-днями без штрафа и commitment-друзьями

### Посты и намерения
- **Планы постов** - индивидуальные цели для Рамадана, казы и нафл постов
- **Календарь** - планирование дат, уведомления об актуальных днях, серия выполнения
- **Статистика** - прогресс и рекорды по каждому плану + общий процентов выполнения

## Технологии

- **Frontend**: React 18 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Роутинг**: React Router
- **State**: React Query
- **Сборка**: Vite
- **Интеграции**: Telegram WebApp API, e-Replika API

## Установка

```bash
# Клонировать репозиторий
git clone https://github.com/ahmed11551/prayer-debt-tracker.git

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev
```

## Настройка

Создайте файл `.env` в корне проекта:

```env
VITE_API_BASE_URL=https://bot.e-replika.ru/api
VITE_INTERNAL_API_URL=/api
VITE_API_TOKEN=your_api_token_here
```

## Сборка

```bash
# Production сборка
npm run build

# Preview сборки
npm run preview
```

## Telegram Mini App

Приложение готово для использования в Telegram Mini App. Telegram WebApp API автоматически инициализируется при загрузке.

## Особенности

- Полная реализация ТЗ
- Поддержка мазхабов (ханафитский, шафиитский)
- AI-функции (мотиватор, трекер, оптимизатор)
- Интеграция с e-Replika API
- AuditLog для безопасности
- Согласие на обработку данных
- Соревновательный эффект с друзьями
- Категоризированные дуа и азкары
- Drizzle Kit миграции и типобезопасный доступ к базе
- Module Federation remote (micro-frontend)

## Drizzle Kit и миграции

Для управления схемой БД используется [drizzle-kit](https://orm.drizzle.team/). Перед запуском убедитесь, что в корне проекта задано подключение к базе:

```dotenv
# .env
DATABASE_URL="postgres://user:password@host:5432/database"
```

Основные команды:

```bash
# сгенерировать SQL-миграции на основании схемы из drizzle/schema.ts
npm run drizzle:generate

# применить миграции к базе данных
npm run drizzle:migrate

# открыть Drizzle Studio для просмотра данных
npm run drizzle:studio
```

Все описания таблиц и enum находятся в `drizzle/schema.ts`, конфигурация CLI — в `drizzle.config.ts`, а SQL-файлы попадают в директорию `drizzle/migrations`.

## Module Federation (микрофронт)

Проект собирается как remote-приложение через [@module-federation/vite](https://github.com/module-federation/universe/tree/main/packages/vite). При `npm run build` дополнительно генерируется `remoteEntry.js`, который можно подключить в host-приложение.

### Экспонированные сущности

```
// tasbihRemote @ https://<host>/assets/remoteEntry.js
import("tasbihRemote/App").then(({ App, mount }) => { ... });
```

- `App` — корневой React-компонент.
- `mount(element?: HTMLElement)` — helper-функция, которая монтирует приложение и возвращает `unmount`.

### Пример интеграции в host

```js
// webpack.config.js (host)
new ModuleFederationPlugin({
  remotes: {
    tasbihRemote: "tasbihRemote@https://cdn.example.com/remoteEntry.js",
  },
});
```

```tsx
// runtime
const { mount } = await import("tasbihRemote/App");
const unmount = mount(document.getElementById("tasbih-root"));
```

Зависимости `react`, `react-dom`, `react-router-dom` объявлены единичными (singleton), поэтому host и remote используют один экземпляр React.

## Лицензия

Проект создан для использования в Telegram Mini App MubarakWay.

## Ссылки

- [e-Replika API Documentation](https://bot.e-replika.ru/docs#/)
- [Telegram WebApp API](https://core.telegram.org/bots/webapps)
