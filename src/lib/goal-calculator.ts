// Утилиты для расчета целей и ежедневных планов

import type { Goal } from "@/types/spiritual-path";
import { differenceInDays, addDays, isAfter, isBefore, startOfDay } from "date-fns";

/**
 * Расчет ежедневного плана для цели
 * Формула: (Общая цель - Уже выполнено) / Оставшееся количество дней = Ежедневный план
 */
export function calculateDailyPlan(goal: Goal): number | null {
  // Для бессрочных привычек план не рассчитывается
  if (goal.type === "habit" || goal.period === "infinite") {
    return null;
  }

  // Если нет даты окончания, план не рассчитывается
  if (!goal.end_date) {
    return null;
  }

  const now = startOfDay(new Date());
  const endDate = startOfDay(new Date(goal.end_date));
  const startDate = startOfDay(new Date(goal.start_date));

  // Если цель уже завершена или просрочена
  if (isAfter(now, endDate)) {
    return null;
  }

  // Если цель еще не началась
  if (isBefore(now, startDate)) {
    const totalDays = differenceInDays(endDate, startDate);
    if (totalDays <= 0) return null;
    return Math.ceil(goal.target_value / totalDays);
  }

  // Расчет оставшихся дней
  const daysRemaining = differenceInDays(endDate, now);
  if (daysRemaining <= 0) return null;

  // Расчет оставшегося объема
  const remainingValue = Math.max(0, goal.target_value - goal.current_value);
  if (remainingValue <= 0) return null;

  // Ежедневный план
  return Math.ceil(remainingValue / daysRemaining);
}

/**
 * Расчет прогресса цели в процентах
 */
export function calculateProgressPercent(goal: Goal): number {
  if (goal.target_value === 0) return 0;
  return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
}

/**
 * Получение статуса выполнения плана
 * Возвращает: "ahead" (опережает), "on_track" (по плану), "behind" (отстает)
 */
export function getPlanStatus(goal: Goal): "ahead" | "on_track" | "behind" | null {
  const dailyPlan = calculateDailyPlan(goal);
  if (!dailyPlan || !goal.end_date) return null;

  const now = startOfDay(new Date());
  const startDate = startOfDay(new Date(goal.start_date));
  const endDate = startOfDay(new Date(goal.end_date));

  // Если цель еще не началась
  if (isBefore(now, startDate)) {
    return "on_track";
  }

  // Если цель уже завершена
  if (isAfter(now, endDate)) {
    return goal.current_value >= goal.target_value ? "ahead" : "behind";
  }

  // Расчет ожидаемого прогресса на текущий момент
  const daysPassed = differenceInDays(now, startDate);
  const expectedProgress = dailyPlan * daysPassed;
  const actualProgress = goal.current_value;

  // Допустимое отклонение (10%)
  const tolerance = dailyPlan * 0.1;

  if (actualProgress >= expectedProgress + tolerance) {
    return "ahead";
  } else if (actualProgress >= expectedProgress - tolerance) {
    return "on_track";
  } else {
    return "behind";
  }
}

/**
 * Получение текстового статуса цели
 */
export function getGoalStatusText(goal: Goal): string {
  const progressPercent = calculateProgressPercent(goal);
  
  if (goal.metric === "regularity") {
    // Для регулярности показываем дни
    const daysCompleted = goal.current_value;
    const daysTarget = goal.target_value;
    return `Выполнено ${daysCompleted} из ${daysTarget} дней`;
  } else {
    // Для количества показываем конкретные значения
    const remaining = Math.max(0, goal.target_value - goal.current_value);
    
    if (goal.category === "prayer") {
      return `Осталось ${remaining} намазов`;
    } else if (goal.category === "quran") {
      return `Осталось ${remaining} страниц`;
    } else if (goal.category === "zikr" || goal.linked_counter_type) {
      if (goal.linked_counter_type === "salawat") {
        return `Осталось ${remaining} салаватов`;
      } else if (goal.linked_counter_type === "tasbih") {
        return `Осталось ${remaining} зикров`;
      }
      return `Осталось ${remaining} зикров`;
    } else if (goal.category === "sadaqa") {
      return `Осталось ${remaining} раз`;
    }
    
    return `Осталось ${remaining} из ${goal.target_value}`;
  }
}

/**
 * Получение количества дней до дедлайна
 */
export function getDaysUntilDeadline(goal: Goal): number | null {
  if (!goal.end_date) return null;
  
  const now = startOfDay(new Date());
  const endDate = startOfDay(new Date(goal.end_date));
  
  if (isAfter(now, endDate)) return 0;
  
  return differenceInDays(endDate, now);
}

/**
 * Проверка, нужно ли пересчитать ежедневный план
 * План пересчитывается каждый день
 */
export function shouldRecalculateDailyPlan(goal: Goal): boolean {
  if (!goal.end_date || !goal.daily_plan) return false;
  
  const now = startOfDay(new Date());
  const lastUpdated = goal.updated_at ? startOfDay(new Date(goal.updated_at)) : null;
  
  // Если обновление было сегодня, пересчет не нужен
  if (lastUpdated && differenceInDays(now, lastUpdated) === 0) {
    return false;
  }
  
  return true;
}

/**
 * Пересчет ежедневного плана для цели
 */
export function recalculateDailyPlan(goal: Goal): Goal {
  const newDailyPlan = calculateDailyPlan(goal);
  
  return {
    ...goal,
    daily_plan: newDailyPlan || undefined,
    updated_at: new Date(),
  };
}

