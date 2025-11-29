// Компонент карточки цели (детальный вид)

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft,
  X,
  CheckCircle2,
  Trash2,
  Edit,
  Sparkles,
  Calendar,
  Bell,
  Play,
  BookOpen,
  Prayer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal } from "@/types/spiritual-path";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GoalCardProps {
  goal: Goal;
  onBack: () => void;
  onUpdate: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  prayer: "Намаз",
  quran: "Коран",
  zikr: "Зикр/Дуа",
  sadaqa: "Садака",
  knowledge: "Знания",
  names_of_allah: "99 имен Аллаха",
};

export const GoalCard = ({ goal, onBack, onUpdate }: GoalCardProps) => {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  const progressPercent = goal.target_value > 0 
    ? Math.min(100, (goal.current_value / goal.target_value) * 100) 
    : 0;

  const daysRemaining = goal.end_date 
    ? Math.max(0, Math.ceil((new Date(goal.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  const isOverdue = goal.end_date && new Date(goal.end_date) < new Date() && goal.status === "active";
  const isUrgent = daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0;

  const handleDelete = async () => {
    try {
      await spiritualPathAPI.deleteGoal(goal.id);
      toast({
        title: "Цель удалена",
      });
      onBack();
      onUpdate();
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить цель",
        variant: "destructive",
      });
    }
  };

  const handleComplete = async () => {
    try {
      await spiritualPathAPI.updateGoal(goal.id, { status: "completed" });
      toast({
        title: "Цель завершена!",
        description: "Поздравляем с достижением цели!",
      });
      onBack();
      onUpdate();
    } catch (error) {
      console.error("Error completing goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось завершить цель",
        variant: "destructive",
      });
    }
  };

  const handleAddProgress = async (value: number) => {
    try {
      await spiritualPathAPI.addProgress(goal.id, value);
      toast({
        title: "Прогресс обновлен",
      });
      onUpdate();
    } catch (error) {
      console.error("Error adding progress:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить прогресс",
        variant: "destructive",
      });
    }
  };

  const handleGoToTasbih = () => {
    // Переход к тасбиху с предвыбранной целью
    window.location.href = "/dhikr?goal=" + goal.id;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-5 h-5 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Карточка цели */}
        <Card className={cn(
          "bg-gradient-card border-border/50",
          isOverdue && "border-red-500/50",
          isUrgent && "border-yellow-500/50"
        )}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className="whitespace-nowrap">{CATEGORY_LABELS[goal.category]}</Badge>
                  {isOverdue && (
                    <Badge variant="destructive" className="whitespace-nowrap">Просрочено</Badge>
                  )}
                  {isUrgent && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600 whitespace-nowrap">
                      Срочно
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl mb-2 break-words">{goal.title}</CardTitle>
                {goal.description && (
                  <p className="text-muted-foreground break-words">{goal.description}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
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

            {/* Ежедневный план */}
            {goal.daily_plan && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-semibold text-sm">Ежедневный план</span>
                </div>
                <p className="text-sm text-muted-foreground break-words">
                  Делайте <strong className="text-primary">{Math.ceil(goal.daily_plan)}</strong>{" "}
                  {goal.metric === "count" ? "в день" : "дней подряд"}
                  {daysRemaining !== null && (
                    <span> (осталось {daysRemaining} дн.)</span>
                  )}
                </p>
              </div>
            )}

            {/* Даты */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-muted-foreground">Начало</div>
                  <div className="font-semibold">
                    {format(new Date(goal.start_date), "dd.MM.yyyy")}
                  </div>
                </div>
              </div>
              {goal.end_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-muted-foreground">Окончание</div>
                    <div className="font-semibold">
                      {format(new Date(goal.end_date), "dd.MM.yyyy")}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="space-y-2">
              {goal.category === "prayer" ? (
                // Для намазов - кнопки выполнения
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleAddProgress(1)}
                    className="min-w-0"
                  >
                    <span className="truncate">Выполнил +1</span>
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleAddProgress(goal.target_value - goal.current_value)}
                    className="min-w-0"
                  >
                    <span className="truncate">Выполнил все</span>
                  </Button>
                </div>
              ) : goal.linked_counter_type ? (
                // Для целей с тасбихом
                <Button
                  variant="default"
                  className="w-full min-w-0"
                  onClick={handleGoToTasbih}
                >
                  <Play className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">Перейти к тасбиху</span>
                </Button>
              ) : (
                // Для остальных - ручное добавление прогресса
                <Button
                  variant="outline"
                  className="w-full min-w-0"
                  onClick={() => handleAddProgress(1)}
                >
                  <span className="truncate">Отметить выполнение</span>
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCompleteDialogOpen(true)}
                  disabled={goal.current_value < goal.target_value}
                  className="min-w-0"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">Завершить</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {/* TODO: открыть диалог редактирования */}}
                  className="min-w-0"
                >
                  <Edit className="w-4 h-4 mr-2 shrink-0" />
                  <span className="truncate">Редактировать</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Диалог удаления */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить цель?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить цель "{goal.title}"? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог завершения */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Завершить цель?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите отметить цель "{goal.title}" как завершенную?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              Завершить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

