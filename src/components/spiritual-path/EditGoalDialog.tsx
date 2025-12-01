// Компонент для редактирования цели

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Target } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import { calculateDailyPlan } from "@/lib/goal-calculator";
import type { Goal, GoalCategory, GoalType, GoalPeriod, GoalMetric } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";

interface EditGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal;
  onGoalUpdated?: () => void;
}

export const EditGoalDialog = ({
  open,
  onOpenChange,
  goal,
  onGoalUpdated,
}: EditGoalDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [description, setDescription] = useState(goal.description || "");
  const [targetValue, setTargetValue] = useState(goal.target_value);
  const [startDate, setStartDate] = useState<Date>(new Date(goal.start_date));
  const [endDate, setEndDate] = useState<Date | undefined>(
    goal.end_date ? new Date(goal.end_date) : undefined
  );
  const [period, setPeriod] = useState<GoalPeriod>(goal.period);
  const [type, setType] = useState<GoalType>(goal.type);

  useEffect(() => {
    if (open) {
      setTitle(goal.title);
      setDescription(goal.description || "");
      setTargetValue(goal.target_value);
      setStartDate(new Date(goal.start_date));
      setEndDate(goal.end_date ? new Date(goal.end_date) : undefined);
      setPeriod(goal.period);
      setType(goal.type);
    }
  }, [open, goal]);

  const calculateEndDate = (period: GoalPeriod, start: Date): Date | null => {
    if (period === "infinite" || period === "recurring_weekly" || period === "recurring_monthly") {
      return null;
    }

    const end = new Date(start);
    switch (period) {
      case "week":
        end.setDate(end.getDate() + 7);
        break;
      case "month":
        end.setMonth(end.getMonth() + 1);
        break;
      case "forty_days":
        end.setDate(end.getDate() + 40);
        break;
      case "year":
        end.setFullYear(end.getFullYear() + 1);
        break;
      case "custom":
        return endDate || null;
    }
    return end;
  };

  const handleSubmit = async () => {
    if (!title || !targetValue) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let finalEndDate: Date | undefined = undefined;
      if (period === "custom") {
        finalEndDate = endDate;
      } else if (period !== "infinite" && period !== "recurring_weekly" && period !== "recurring_monthly") {
        finalEndDate = calculateEndDate(period, startDate) || undefined;
      }

      // Пересчитываем ежедневный план
      const dailyPlan = finalEndDate
        ? calculateDailyPlan({
            ...goal,
            start_date: startDate,
            end_date: finalEndDate,
            target_value: targetValue,
          })
        : null;

      await spiritualPathAPI.updateGoal(goal.id, {
        title,
        description: description || undefined,
        target_value: targetValue,
        start_date: startDate,
        end_date: finalEndDate,
        period,
        type,
        daily_plan: dailyPlan || undefined,
      });

      toast({
        title: "Цель обновлена!",
        description: dailyPlan ? `Новый ежедневный план: ${Math.ceil(dailyPlan)}` : undefined,
      });

      onOpenChange(false);
      onGoalUpdated?.();
    } catch (error) {
      console.error("Error updating goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить цель",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const dailyPlan = endDate
    ? calculateDailyPlan({
        ...goal,
        start_date: startDate,
        end_date: endDate,
        target_value: targetValue,
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Редактировать цель
          </DialogTitle>
          <DialogDescription>
            Измените параметры цели. Ежедневный план будет пересчитан автоматически.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Название */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Название цели *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Описание */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Описание</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Целевое значение */}
          <div className="space-y-2">
            <Label htmlFor="edit-target">Целевое значение *</Label>
            <Input
              id="edit-target"
              type="number"
              min="1"
              value={targetValue}
              onChange={(e) => setTargetValue(parseInt(e.target.value) || 0)}
            />
          </div>

          {/* Тип цели */}
          <div className="space-y-2">
            <Label>Тип цели</Label>
            <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_time">Одноразовая</SelectItem>
                <SelectItem value="recurring">Повторяющаяся</SelectItem>
                <SelectItem value="fixed_term">С фиксированным сроком</SelectItem>
                <SelectItem value="habit">Бессрочная привычка</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Период */}
          <div className="space-y-2">
            <Label>Срок выполнения</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as GoalPeriod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="infinite">Бессрочная</SelectItem>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
                <SelectItem value="forty_days">40 дней</SelectItem>
                <SelectItem value="year">Год</SelectItem>
                <SelectItem value="custom">К определенной дате</SelectItem>
                <SelectItem value="recurring_weekly">Повторяющаяся еженедельно</SelectItem>
                <SelectItem value="recurring_monthly">Повторяющаяся ежемесячно</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Дата начала */}
          <div className="space-y-2">
            <Label className="text-sm leading-tight break-words">Дата начала</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    "overflow-hidden text-ellipsis whitespace-nowrap",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {startDate ? format(startDate, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Дата окончания (если не бессрочная) */}
          {period === "custom" && (
            <div className="space-y-2">
              <Label className="text-sm leading-tight break-words">Дата окончания</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      "overflow-hidden text-ellipsis whitespace-nowrap",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {endDate ? format(endDate, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Ежедневный план (предпросмотр) */}
          {dailyPlan && (
            <div className="bg-secondary/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Новый ежедневный план:</p>
              <p className="text-lg font-semibold">
                {Math.ceil(dailyPlan)}{" "}
                {goal.linked_counter_type === "salawat"
                  ? "салаватов"
                  : goal.category === "quran"
                  ? "страниц"
                  : "раз"}{" "}
                в день
              </p>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

