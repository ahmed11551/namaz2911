// Лента целей - визуальные карточки

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Target,
  CheckCircle2,
  Pause,
  Edit,
  Trash2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import {
  calculateDailyPlan,
  calculateProgressPercent,
  getPlanStatus,
  getGoalStatusText,
  getDaysUntilDeadline,
  recalculateDailyPlan,
  shouldRecalculateDailyPlan,
} from "@/lib/goal-calculator";
import type { Goal } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";
import { GoalCardFeed } from "./GoalCardFeed";
import { EditGoalDialog } from "./EditGoalDialog";

interface GoalFeedProps {
  goals?: Goal[];
  onRefresh?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  prayer: "🕌",
  quran: "📖",
  zikr: "📿",
  sadaqa: "💝",
  knowledge: "📚",
  names_of_allah: "✨",
};

const CATEGORY_LABELS: Record<string, string> = {
  prayer: "Намаз",
  quran: "Коран",
  zikr: "Зикр",
  sadaqa: "Садака",
  knowledge: "Знания",
  names_of_allah: "99 имен Аллаха",
};

export const GoalFeed = ({ goals = [], onRefresh }: GoalFeedProps) => {
  const { toast } = useToast();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalsList, setGoalsList] = useState<Goal[]>(goals);

  useEffect(() => {
    setGoalsList(goals);
    // Пересчитываем ежедневные планы для всех активных целей
    const recalculateAndSave = async () => {
      const goalsToUpdate: Goal[] = [];
      
      for (const goal of goals) {
        if (goal.status === "active" && shouldRecalculateDailyPlan(goal)) {
          const updatedGoal = recalculateDailyPlan(goal);
          goalsToUpdate.push(updatedGoal);
          
          // Сохраняем обновленный план на сервер (тихо, без уведомлений)
          try {
            await spiritualPathAPI.updateGoal(goal.id, {
              daily_plan: updatedGoal.daily_plan,
              updated_at: updatedGoal.updated_at,
            });
          } catch (error) {
            console.error(`Error updating daily plan for goal ${goal.id}:`, error);
            // Продолжаем работу даже при ошибке
          }
        }
      }
      
      // Обновляем локальное состояние
      if (goalsToUpdate.length > 0) {
        const updatedGoals = goals.map(goal => {
          const updated = goalsToUpdate.find(g => g.id === goal.id);
          return updated || goal;
        });
        setGoalsList(updatedGoals);
      }
    };
    
    recalculateAndSave();
  }, [goals]);

  const handlePause = async (goal: Goal) => {
    try {
      await spiritualPathAPI.updateGoal(goal.id, { status: "paused" });
      toast({
        title: "Цель приостановлена",
        description: "Вы можете возобновить её позже",
      });
      onRefresh?.();
    } catch (error) {
      console.error("Error pausing goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось приостановить цель",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (goal: Goal) => {
    if (!confirm("Вы уверены, что хотите удалить эту цель? Прогресс будет потерян.")) {
      return;
    }

    try {
      await spiritualPathAPI.deleteGoal(goal.id);
      toast({
        title: "Цель удалена",
        description: "Цель успешно удалена",
      });
      onRefresh?.();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить цель",
        variant: "destructive",
      });
    }
  };

  const handleMarkComplete = async (goal: Goal) => {
    try {
      await spiritualPathAPI.updateGoal(goal.id, {
        status: "completed",
        current_value: goal.target_value,
      });
      toast({
        title: "Цель выполнена!",
        description: "Ма ша Аллах!",
      });
      onRefresh?.();
    } catch (error) {
      console.error("Error marking complete:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отметить цель как выполненную",
        variant: "destructive",
      });
    }
  };

  const handleGoToTasbih = (goal: Goal) => {
    // Переход к тасбиху с предустановленным типом
    window.location.href = `/dhikr?goal=${goal.id}&type=${goal.linked_counter_type}`;
  };

  // Сортируем цели: активные сначала, затем по дате создания
  const sortedGoals = useMemo(() => {
    return [...goalsList].sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (a.status !== "active" && b.status === "active") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [goalsList]);

  if (sortedGoals.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-semibold mb-2">Нет целей</p>
        <p className="text-muted-foreground mb-4">
          Создайте свою первую цель для духовного роста
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedGoals.map((goal) => (
        <GoalCardFeed
          key={goal.id}
          goal={goal}
          onEdit={() => setEditingGoal(goal)}
          onPause={() => handlePause(goal)}
          onDelete={() => handleDelete(goal)}
          onMarkComplete={() => handleMarkComplete(goal)}
          onGoToTasbih={() => handleGoToTasbih(goal)}
        />
      ))}

      {editingGoal && (
        <EditGoalDialog
          open={!!editingGoal}
          onOpenChange={(open) => !open && setEditingGoal(null)}
          goal={editingGoal}
          onGoalUpdated={() => {
            setEditingGoal(null);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};

