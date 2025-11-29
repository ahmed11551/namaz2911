// Компонент для отображения списка целей с визуализацией прогресса

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Circle,
  Pause,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal, GoalStatus } from "@/types/spiritual-path";
import { format } from "date-fns";
import { CreateGoalDialog } from "./CreateGoalDialog";
import { cn } from "@/lib/utils";

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
  zikr: "Зикр/Дуа",
  sadaqa: "Садака",
  knowledge: "Знания",
  names_of_allah: "99 имен Аллаха",
};

export const GoalsList = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filter, setFilter] = useState<GoalStatus | "all">("all");

  useEffect(() => {
    loadGoals();
  }, [filter]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const allGoals = await spiritualPathAPI.getGoals();
      
      // Пересчитываем ежедневные планы для активных целей
      const { recalculateDailyPlan, shouldRecalculateDailyPlan } = await import("@/lib/goal-calculator");
      const goalsToUpdate: Goal[] = [];
      
      for (const goal of allGoals) {
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
      
      // Обновляем локальное состояние с пересчитанными планами
      const updatedGoals = allGoals.map(goal => {
        const updated = goalsToUpdate.find(g => g.id === goal.id);
        return updated || goal;
      });
      
      setGoals(updatedGoals);
    } catch (error) {
      console.error("Error loading goals:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить цели",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту цель?")) return;

    try {
      await spiritualPathAPI.deleteGoal(goalId);
      toast({
        title: "Цель удалена",
      });
      loadGoals();
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
      await spiritualPathAPI.updateGoal(goal.id, { status: "completed" });
      toast({
        title: "Цель выполнена!",
        description: "Поздравляем с достижением цели!",
      });
      loadGoals();
    } catch (error) {
      console.error("Error updating goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить цель",
        variant: "destructive",
      });
    }
  };

  const handleAddProgress = async (goalId: string) => {
    // Здесь можно открыть диалог для добавления прогресса
    // Пока просто добавляем 1
    try {
      await spiritualPathAPI.addProgress(goalId, 1);
      toast({
        title: "Прогресс обновлен",
      });
      loadGoals();
    } catch (error) {
      console.error("Error adding progress:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить прогресс",
        variant: "destructive",
      });
    }
  };

  const getStatusIndicator = (goal: Goal): { icon: React.ReactNode; color: string; label: string } => {
    const today = new Date();
    const endDate = goal.end_date ? new Date(goal.end_date) : null;
    const isOverdue = endDate && endDate < today && goal.status === "active";
    const progressPercent = goal.target_value > 0 
      ? Math.min(100, (goal.current_value / goal.target_value) * 100) 
      : 0;

    if (goal.status === "completed") {
      return { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-500", label: "Выполнено" };
    }
    if (goal.status === "paused") {
      return { icon: <Pause className="w-4 h-4" />, color: "text-yellow-500", label: "Приостановлено" };
    }
    if (isOverdue) {
      return { icon: <AlertCircle className="w-4 h-4" />, color: "text-red-500", label: "Просрочено" };
    }
    if (progressPercent >= 80) {
      return { icon: <TrendingUp className="w-4 h-4" />, color: "text-green-500", label: "Отлично" };
    }
    if (progressPercent >= 50) {
      return { icon: <Circle className="w-4 h-4" />, color: "text-yellow-500", label: "Хорошо" };
    }
    return { icon: <Circle className="w-4 h-4" />, color: "text-red-500", label: "Нужно больше усилий" };
  };

  const getDailyPlanStatus = (goal: Goal): { status: "on_track" | "behind" | "ahead"; message: string } => {
    if (!goal.daily_plan || !goal.end_date) {
      return { status: "on_track", message: "" };
    }

    const today = new Date();
    const endDate = new Date(goal.end_date);
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const expectedProgress = goal.target_value - (daysRemaining * goal.daily_plan);
    const actualProgress = goal.current_value;

    if (actualProgress >= expectedProgress) {
      return { status: "ahead", message: "Вы впереди графика!" };
    } else if (actualProgress < expectedProgress * 0.8) {
      const needed = Math.ceil((goal.target_value - goal.current_value) / Math.max(1, daysRemaining));
      return { 
        status: "behind", 
        message: `Чтобы достичь цель, нужно делать ${needed} в день` 
      };
    }
    return { status: "on_track", message: "Вы на правильном пути" };
  };

  const filteredGoals = filter === "all" 
    ? goals 
    : goals.filter(g => g.status === filter);

  const activeGoals = filteredGoals.filter(g => g.status === "active");
  const completedGoals = filteredGoals.filter(g => g.status === "completed");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка целей...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Мои цели
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Отслеживайте свой духовный рост
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Создать цель
        </Button>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2">
        {(["all", "active", "paused", "completed"] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === "all" ? "Все" : 
             status === "active" ? "Активные" :
             status === "paused" ? "Приостановленные" : "Выполненные"}
          </Button>
        ))}
      </div>

      {/* Активные цели */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Активные цели ({activeGoals.length})
          </h3>
          {activeGoals.map((goal) => {
            const progressPercent = goal.target_value > 0 
              ? Math.min(100, (goal.current_value / goal.target_value) * 100) 
              : 0;
            const statusIndicator = getStatusIndicator(goal);
            const dailyPlanStatus = getDailyPlanStatus(goal);
            const daysRemaining = goal.end_date 
              ? Math.max(0, Math.ceil((new Date(goal.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
              : null;

            return (
              <Card key={goal.id} className="bg-gradient-card shadow-medium border-border/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{CATEGORY_ICONS[goal.category]}</span>
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <Badge variant="outline">{CATEGORY_LABELS[goal.category]}</Badge>
                      </div>
                      {goal.description && (
                        <CardDescription className="mt-1">{goal.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("flex items-center gap-1", statusIndicator.color)}>
                        {statusIndicator.icon}
                        <span className="text-xs">{statusIndicator.label}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Прогресс */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">
                        {goal.current_value} / {goal.target_value} {goal.metric === "count" ? "раз" : "дней"}
                      </span>
                      <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-3" />
                  </div>

                  {/* Дополнительная информация */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {goal.daily_plan && (
                      <div className="flex items-center gap-2 min-w-0">
                        <Sparkles className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-muted-foreground truncate">
                          План: <strong>{Math.ceil(goal.daily_plan)}</strong> в день
                        </span>
                      </div>
                    )}
                    {daysRemaining !== null && (
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate">
                          Осталось: <strong>{daysRemaining}</strong> дн.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Статус выполнения дневного плана */}
                  {dailyPlanStatus.message && (
                    <div className={cn(
                      "p-3 rounded-lg text-sm",
                      dailyPlanStatus.status === "behind" && "bg-red-500/10 text-red-600 border border-red-500/20",
                      dailyPlanStatus.status === "ahead" && "bg-green-500/10 text-green-600 border border-green-500/20",
                      dailyPlanStatus.status === "on_track" && "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                    )}>
                      {dailyPlanStatus.message}
                    </div>
                  )}

                  {/* Кнопки действий */}
                  <div className="flex gap-2 flex-wrap">
                    {goal.linked_counter_type ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Переход к тасбиху
                          window.location.href = "/dhikr";
                        }}
                        className="flex-1 min-w-0"
                      >
                        <span className="truncate">Перейти к тасбиху</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddProgress(goal.id)}
                        className="flex-1 min-w-0"
                      >
                        <span className="truncate">Отметить выполнение</span>
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleMarkComplete(goal)}
                      disabled={goal.current_value < goal.target_value}
                      className="shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
                      <span className="whitespace-nowrap">Выполнено</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Выполненные цели */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Выполненные цели ({completedGoals.length})
          </h3>
          {completedGoals.map((goal) => (
            <Card key={goal.id} className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{CATEGORY_ICONS[goal.category]}</span>
                    <div>
                      <div className="font-semibold">{goal.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {goal.current_value} / {goal.target_value} {goal.metric === "count" ? "раз" : "дней"}
                      </div>
                    </div>
                  </div>
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Пустое состояние */}
      {filteredGoals.length === 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                {filter === "all" 
                  ? "У вас пока нет целей. Создайте первую цель для отслеживания прогресса!"
                  : "Нет целей с таким статусом"}
              </p>
              {filter === "all" && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать цель
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <CreateGoalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onGoalCreated={loadGoals}
      />
    </div>
  );
};

