// Утилита для синхронизации прогресса каза намазов с целями

import { spiritualPathAPI } from "./api";
import type { UserPrayerDebt } from "@/types/prayer-debt";

/**
 * Синхронизирует прогресс восполнения намазов с целями категории "prayer"
 */
export async function syncQazaProgressWithGoals(
  userData: UserPrayerDebt | null,
  userId: string
): Promise<void> {
  if (!userData?.repayment_progress?.completed_prayers) {
    return;
  }

  try {
    // Получаем все активные цели категории "prayer"
    const goals = await spiritualPathAPI.getGoals("active");
    const qazaGoals = goals.filter(g => g.category === "prayer");

    if (qazaGoals.length === 0) {
      return;
    }

    // Подсчитываем общий прогресс восполнения
    const totalCompleted = Object.values(
      userData.repayment_progress.completed_prayers
    ).reduce((sum, val) => sum + (val || 0), 0);

    // Обновляем каждую цель каза
    for (const goal of qazaGoals) {
      // Проверяем, что цель связана с каза (по названию или описанию)
      const isQazaGoal = 
        goal.title.toLowerCase().includes("каза") ||
        goal.title.toLowerCase().includes("восполнить") ||
        goal.description?.toLowerCase().includes("каза");

      if (isQazaGoal && goal.current_value !== totalCompleted) {
        // Обновляем прогресс цели
        const progressDiff = totalCompleted - goal.current_value;
        if (progressDiff > 0) {
          await spiritualPathAPI.addProgress(goal.id, progressDiff);
        } else if (progressDiff < 0) {
          // Если прогресс уменьшился (редкий случай), обновляем напрямую
          await spiritualPathAPI.updateGoal(goal.id, {
            current_value: totalCompleted,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error syncing Qaza progress with goals:", error);
    // Не пробрасываем ошибку, чтобы не мешать основному функционалу
  }
}

/**
 * Создает цель на основе расчета каза, если её еще нет
 */
export async function createQazaGoalIfNeeded(
  totalDebt: number,
  userId: string
): Promise<string | null> {
  try {
    // Проверяем, есть ли уже цель для каза
    const goals = await spiritualPathAPI.getGoals("active");
    const existingQazaGoal = goals.find(g => 
      g.category === "prayer" &&
      (g.title.toLowerCase().includes("каза") || 
       g.title.toLowerCase().includes("восполнить"))
    );

    if (existingQazaGoal) {
      // Обновляем целевую сумму, если она изменилась
      if (existingQazaGoal.target_value !== totalDebt) {
        await spiritualPathAPI.updateGoal(existingQazaGoal.id, {
          target_value: totalDebt,
        });
      }
      return existingQazaGoal.id;
    }

    // Создаем новую цель
    const daysToComplete = 365; // Год на восполнение
    const dailyPlan = Math.ceil(totalDebt / daysToComplete);

    const newGoal = await spiritualPathAPI.createGoal({
      title: `Восполнить ${totalDebt} намазов (Каза)`,
      description: `Автоматически созданная цель на основе расчета каза. Рекомендуемый ежедневный план: ${dailyPlan} намазов.`,
      category: "prayer",
      type: "fixed_term",
      period: "custom",
      metric: "count",
      target_value: totalDebt,
      current_value: 0,
      start_date: new Date(),
      end_date: new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000),
      status: "active",
      daily_plan: dailyPlan,
    });

    return newGoal.id;
  } catch (error) {
    console.error("Error creating Qaza goal:", error);
    return null;
  }
}

