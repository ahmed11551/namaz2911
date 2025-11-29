// AI-функции согласно ТЗ

import type { DebtSnapshot, RepaymentProgress } from "@/types/prayer-debt";

/**
 * AI-мотиватор
 * Генерирует мотивационные сообщения на основе прогресса
 */
export function generateMotivationalMessage(
  progress: number,
  totalCompleted: number
): string {
  const milestones: Record<number, string> = {
    100: "Поздравляем! Первые 100 намазов восполнены!",
    1000: "Ма ша Аллах! Вы достигли 1000 намазов!",
    50: "Вы прошли половину пути. Пусть Аллах укрепит вас!",
  };

  // Проверка точных значений
  if (milestones[totalCompleted]) {
    return milestones[totalCompleted];
  }

  // Проверка процентов
  if (progress >= 50 && progress < 51) {
    return milestones[50];
  }

  // Случайные мотивационные цитаты
  const quotes = [
    "Каждый намаз приближает вас к цели. Продолжайте!",
    "Аллах видит ваши усилия. Не останавливайтесь!",
    "Восполнение намазов — это путь к прощению. Вы на правильном пути!",
    "Каждый день — новая возможность. Используйте её!",
    "Ваше терпение и настойчивость будут вознаграждены.",
    "Помните: даже маленький шаг в правильном направлении — это прогресс.",
  ];

  // Выбор цитаты на основе прогресса
  const quoteIndex = Math.floor(progress / 10) % quotes.length;
  return quotes[quoteIndex];
}

/**
 * Умный трекер пропусков
 * Анализирует паттерны пропущенных намазов
 */
export function detectMissedPrayerPatterns(
  repaymentProgress: RepaymentProgress,
  missedPrayers: {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
    witr: number;
  }
): string | null {
  // Расчет процента восполнения для каждого намаза
  const patterns = {
    fajr: (repaymentProgress.completed_prayers.fajr / missedPrayers.fajr) * 100,
    dhuhr: (repaymentProgress.completed_prayers.dhuhr / missedPrayers.dhuhr) * 100,
    asr: (repaymentProgress.completed_prayers.asr / missedPrayers.asr) * 100,
    maghrib: (repaymentProgress.completed_prayers.maghrib / missedPrayers.maghrib) * 100,
    isha: (repaymentProgress.completed_prayers.isha / missedPrayers.isha) * 100,
    witr: (repaymentProgress.completed_prayers.witr / missedPrayers.witr) * 100,
  };

  // Поиск намаза с наименьшим прогрессом
  const sortedPatterns = Object.entries(patterns)
    .filter(([_, value]) => !isNaN(value) && isFinite(value))
    .sort(([_, a], [__, b]) => a - b);

  if (sortedPatterns.length === 0) return null;

  const [lowestPrayer, lowestProgress] = sortedPatterns[0];
  const prayerNames: Record<string, string> = {
    fajr: "Фаджр",
    dhuhr: "Зухр",
    asr: "Аср",
    maghrib: "Магриб",
    isha: "Иша",
    witr: "Витр",
  };

  // Если прогресс меньше 30%, предлагаем помощь
  if (lowestProgress < 30) {
    return `Вы реже восполняете ${prayerNames[lowestPrayer]}. Настроить напоминание?`;
  }

  // Анализ Асра (часто пропускается)
  if (lowestPrayer === "asr" && lowestProgress < 50) {
    return "Вы часто пропускаете Аср. Настроить напоминание?";
  }

  return null;
}

/**
 * Анализ недельных паттернов
 */
export function analyzeWeeklyPattern(
  repaymentProgress: RepaymentProgress,
  lastUpdated: Date
): {
  missedAsr: number;
  weeklyAverage: number;
  trend: "increasing" | "decreasing" | "stable";
} {
  // Упрощенный анализ (в реальном приложении нужна история)
  const daysSinceStart = Math.max(
    1,
    Math.floor((new Date().getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24))
  );

  const totalCompleted = Object.values(repaymentProgress.completed_prayers).reduce(
    (sum, val) => sum + val,
    0
  );

  const weeklyAverage = Math.round((totalCompleted / daysSinceStart) * 7);

  // Симуляция анализа (в реальном приложении нужна история)
  return {
    missedAsr: 0, // В реальном приложении считать из истории
    weeklyAverage,
    trend: "stable", // В реальном приложении анализировать тренд
  };
}

/**
 * Генерация персонального плана на основе паттернов
 */
export function generatePersonalizedPlan(
  snapshot: DebtSnapshot | null
): Array<{ time: string; action: string; count: number }> {
  if (!snapshot) {
    return [
      { time: "После Фаджра", action: "+1 каза", count: 1 },
      { time: "После Асра", action: "+2 каза", count: 2 },
      { time: "В выходные", action: "+5 каза", count: 5 },
    ];
  }

  const totalRemaining =
    Object.values(snapshot.remaining_prayers).reduce((sum, val) => sum + val, 0) +
    Object.values(snapshot.debt_calculation.travel_prayers).reduce((sum, val) => sum + val, 0);

  const totalCompleted = Object.values(snapshot.repayment_progress.completed_prayers).reduce(
    (sum, val) => sum + val,
    0
  );

  const daysSinceStart = Math.max(
    1,
    Math.floor(
      (new Date().getTime() - new Date(snapshot.debt_calculation.period.start).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const currentPace = Math.round(totalCompleted / daysSinceStart) || 10;
  const daysToComplete = Math.ceil(totalRemaining / currentPace);

  // Адаптация плана в зависимости от оставшегося времени
  if (daysToComplete > 365) {
    // Если больше года, более агрессивный план
    return [
      { time: "После Фаджра", action: "+2 каза", count: 2 },
      { time: "После Зухра", action: "+1 каза", count: 1 },
      { time: "После Асра", action: "+2 каза", count: 2 },
      { time: "После Магриба", action: "+1 каза", count: 1 },
      { time: "В выходные", action: "+10 каза", count: 10 },
    ];
  } else if (daysToComplete > 180) {
    // Если больше полугода, умеренный план
    return [
      { time: "После Фаджра", action: "+1 каза", count: 1 },
      { time: "После Асра", action: "+2 каза", count: 2 },
      { time: "После Иша", action: "+1 каза", count: 1 },
      { time: "В выходные", action: "+5 каза", count: 5 },
    ];
  } else {
    // Если меньше полугода, стандартный план
    return [
      { time: "После Фаджра", action: "+1 каза", count: 1 },
      { time: "После Асра", action: "+2 каза", count: 2 },
      { time: "В выходные", action: "+5 каза", count: 5 },
    ];
  }
}

