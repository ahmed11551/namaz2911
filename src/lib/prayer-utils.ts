import type { UserPrayerDebt } from "@/types/prayer-debt";

/**
 * Утилиты для работы с данными о намазах
 * Устраняет дублирование кода и улучшает читаемость
 */

export interface PrayerStats {
  name: string;
  completed: number;
  total: number;
  color: string;
  emoji: string;
}

export interface ProgressStats {
  totalCompleted: number;
  totalMissed: number;
  remaining: number;
  overallProgress: number;
  dailyPace: number;
  weeklyPace: number;
  daysToComplete: number;
  monthsToComplete: number;
  daysRemaining: number;
  startDate: Date;
  daysSinceStart: number;
}

/**
 * Получить массив данных о намазах для отображения
 */
export function getPrayersArray(userData: UserPrayerDebt | null): PrayerStats[] {
  if (!userData) {
    return [];
  }

  const missedPrayers = userData.debt_calculation?.missed_prayers || {};
  const completedPrayers = userData.repayment_progress?.completed_prayers || {};

  return [
    {
      name: "Фаджр",
      completed: completedPrayers.fajr || 0,
      total: missedPrayers.fajr || 0,
      color: "prayer-fajr",
      emoji: "🌅",
    },
    {
      name: "Зухр",
      completed: completedPrayers.dhuhr || 0,
      total: missedPrayers.dhuhr || 0,
      color: "prayer-dhuhr",
      emoji: "☀️",
    },
    {
      name: "Аср",
      completed: completedPrayers.asr || 0,
      total: missedPrayers.asr || 0,
      color: "prayer-asr",
      emoji: "🌤️",
    },
    {
      name: "Магриб",
      completed: completedPrayers.maghrib || 0,
      total: missedPrayers.maghrib || 0,
      color: "prayer-maghrib",
      emoji: "🌇",
    },
    {
      name: "Иша",
      completed: completedPrayers.isha || 0,
      total: missedPrayers.isha || 0,
      color: "prayer-isha",
      emoji: "🌙",
    },
    {
      name: "Витр",
      completed: completedPrayers.witr || 0,
      total: missedPrayers.witr || 0,
      color: "prayer-witr",
      emoji: "✨",
    },
  ];
}

/**
 * Рассчитать статистику прогресса
 */
export function calculateProgressStats(userData: UserPrayerDebt | null): ProgressStats {
  // Безопасная проверка на null/undefined
  if (!userData) {
    return getDefaultStats();
  }

  // Безопасная проверка структуры данных
  try {
    const completedPrayers = userData.repayment_progress?.completed_prayers;
    const missedPrayers = userData.debt_calculation?.missed_prayers;
    
    // Проверяем, что объекты существуют и являются объектами
    if (!completedPrayers || typeof completedPrayers !== 'object') {
      console.warn("Invalid completed_prayers structure");
      return getDefaultStats();
    }
    
    if (!missedPrayers || typeof missedPrayers !== 'object') {
      console.warn("Invalid missed_prayers structure");
      return getDefaultStats();
    }
    
    const totalCompleted = Object.values(completedPrayers).reduce(
      (sum, val) => {
        const num = typeof val === 'number' ? val : 0;
        return sum + (isNaN(num) ? 0 : num);
      },
      0
    );
    
    const totalMissed = Object.values(missedPrayers).reduce(
      (sum, val) => {
        const num = typeof val === 'number' ? val : 0;
        return sum + (isNaN(num) ? 0 : num);
      },
      0
    );
    
    const remaining = Math.max(0, totalMissed - totalCompleted);
    const overallProgress = totalMissed > 0 
      ? Math.min(100, Math.max(0, Math.round((totalCompleted / totalMissed) * 100)))
      : 0;

    // Безопасная обработка даты
    let startDate: Date;
    try {
      if (userData.debt_calculation?.period?.start) {
        const date = new Date(userData.debt_calculation.period.start);
        if (!isNaN(date.getTime())) {
          startDate = date;
        } else {
          startDate = new Date();
        }
      } else {
        startDate = new Date();
      }
    } catch {
      startDate = new Date();
    }
    
    const daysSinceStart = Math.max(
      1,
      Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );

    const dailyPace = daysSinceStart > 0 ? Math.round(totalCompleted / daysSinceStart) : 0;
    const weeklyPace = dailyPace * 7;
    const daysToComplete = dailyPace > 0 ? Math.ceil(remaining / dailyPace) : 0;
    const monthsToComplete = Math.floor(daysToComplete / 30);
    const daysRemaining = daysToComplete % 30;

    return {
      totalCompleted,
      totalMissed,
      remaining,
      overallProgress,
      dailyPace,
      weeklyPace,
      daysToComplete,
      monthsToComplete,
      daysRemaining,
      startDate,
      daysSinceStart,
    };
  } catch (error) {
    console.error("Error in calculateProgressStats:", error);
    return getDefaultStats();
  }
}

/**
 * Получить дефолтную статистику
 */
function getDefaultStats(): ProgressStats {
  return {
    totalCompleted: 0,
    totalMissed: 0,
    remaining: 0,
    overallProgress: 0,
    dailyPace: 0,
    weeklyPace: 0,
    daysToComplete: 0,
    monthsToComplete: 0,
    daysRemaining: 0,
    startDate: new Date(),
    daysSinceStart: 0,
  };
}

/**
 * Форматировать дату для отображения
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Форматировать число с разделителями тысяч
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("ru-RU");
}

/**
 * Интерфейс для достижений
 */
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: Date;
  progress?: number; // Текущий прогресс (0-100)
}

/**
 * Рассчитать достижения на основе прогресса пользователя
 */
export function calculateAchievements(userData: UserPrayerDebt | null): Achievement[] {
  if (!userData) {
    return getDefaultAchievements(false);
  }

  const stats = calculateProgressStats(userData);
  const completedPrayers = userData.repayment_progress?.completed_prayers || {};
  const totalCompleted = Object.values(completedPrayers).reduce(
    (sum, val) => sum + (val || 0),
    0
  );

  // Проверка на серию дней подряд (упрощенная версия)
  // В реальном приложении нужно проверять историю календаря
  const calendarEntries = userData.repayment_progress?.calendar_entries || [];
  const hasWeekStreak = calendarEntries.length >= 7; // Упрощенная проверка

  const startDate = stats.startDate instanceof Date && !isNaN(stats.startDate.getTime())
    ? stats.startDate
    : new Date();

  const achievements: Achievement[] = [
    {
      id: "first-100",
      title: "Первые 100",
      description: "Восполнено 100 намазов",
      icon: "✨",
      unlocked: totalCompleted >= 100,
      unlockedDate: totalCompleted >= 100 ? startDate : undefined,
      progress: Math.min(100, Math.round((totalCompleted / 100) * 100)),
    },
    {
      id: "week-streak",
      title: "7 дней подряд",
      description: "Восполнение намазов 7 дней подряд",
      icon: "🔥",
      unlocked: hasWeekStreak,
      unlockedDate: hasWeekStreak ? startDate : undefined,
      progress: hasWeekStreak ? 100 : Math.min(100, Math.round((calendarEntries.length / 7) * 100)),
    },
    {
      id: "thousand",
      title: "1000 намазов",
      description: "Восполнено 1000 намазов",
      icon: "🌟",
      unlocked: totalCompleted >= 1000,
      unlockedDate: totalCompleted >= 1000 ? startDate : undefined,
      progress: Math.min(100, Math.round((totalCompleted / 1000) * 100)),
    },
    {
      id: "halfway",
      title: "50% пути",
      description: "Пройдена половина пути",
      icon: "🎯",
      unlocked: stats.overallProgress >= 50,
      unlockedDate: stats.overallProgress >= 50 ? startDate : undefined,
      progress: stats.overallProgress,
    },
  ];

  return achievements;
}

/**
 * Получить дефолтные достижения (для случая, когда нет данных)
 */
function getDefaultAchievements(unlocked: boolean): Achievement[] {
  return [
    {
      id: "first-100",
      title: "Первые 100",
      description: "Восполнено 100 намазов",
      icon: "✨",
      unlocked,
    },
    {
      id: "week-streak",
      title: "7 дней подряд",
      description: "Восполнение намазов 7 дней подряд",
      icon: "🔥",
      unlocked,
    },
    {
      id: "thousand",
      title: "1000 намазов",
      description: "Восполнено 1000 намазов",
      icon: "🌟",
      unlocked,
    },
    {
      id: "halfway",
      title: "50% пути",
      description: "Пройдена половина пути",
      icon: "🎯",
      unlocked,
    },
  ];
}

