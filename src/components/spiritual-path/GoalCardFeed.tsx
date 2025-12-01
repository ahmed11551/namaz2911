// Карточка цели для ленты

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Target,
  CheckCircle2,
  Pause,
  Play,
  Edit,
  Trash2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from "lucide-react";
import {
  calculateDailyPlan,
  calculateProgressPercent,
  getPlanStatus,
  getGoalStatusText,
  getDaysUntilDeadline,
} from "@/lib/goal-calculator";
import type { Goal } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale/ru";

interface GoalCardFeedProps {
  goal: Goal;
  onEdit: () => void;
  onPause: () => void;
  onDelete: () => void;
  onMarkComplete: () => void;
  onGoToTasbih: () => void;
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

export const GoalCardFeed = ({
  goal,
  onEdit,
  onPause,
  onDelete,
  onMarkComplete,
  onGoToTasbih,
}: GoalCardFeedProps) => {
  const progressPercent = calculateProgressPercent(goal);
  const dailyPlan = calculateDailyPlan(goal);
  const planStatus = getPlanStatus(goal);
  const statusText = getGoalStatusText(goal);
  const daysUntilDeadline = getDaysUntilDeadline(goal);

  const isLinkedToTasbih = !!goal.linked_counter_type;
  const isComplete = goal.status === "completed";
  const isPaused = goal.status === "paused";

  return (
    <Card
      className={cn(
        "bg-gradient-card border-border/50 transition-all hover:shadow-md",
        isPaused && "opacity-60",
        isComplete && "border-primary/30"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-3xl shrink-0">{CATEGORY_ICONS[goal.category] || "🎯"}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base sm:text-lg break-words leading-tight">{goal.title}</h3>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {CATEGORY_LABELS[goal.category]}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              {goal.status === "active" && (
                <DropdownMenuItem onClick={onPause}>
                  <Pause className="h-4 w-4 mr-2" />
                  Приостановить
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Прогресс-бар */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Прогресс</span>
            <span className="font-semibold">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Текстовый статус */}
        <div className="text-sm">
          <p className="text-muted-foreground break-words">{statusText}</p>
        </div>

        {/* Ежедневный план и индикатор */}
        {dailyPlan && goal.status === "active" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Ежедневный план:</span>
              <div className="flex items-center gap-2 shrink-0">
                {planStatus === "ahead" && (
                  <Badge variant="default" className="bg-green-500 whitespace-nowrap">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Опережаете
                  </Badge>
                )}
                {planStatus === "on_track" && (
                  <Badge variant="default" className="bg-yellow-500 whitespace-nowrap">
                    <Minus className="h-3 w-3 mr-1" />
                    По плану
                  </Badge>
                )}
                {planStatus === "behind" && (
                  <Badge variant="destructive" className="whitespace-nowrap">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Отстаете
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm font-semibold break-words">
              Для достижения цели к сроку делайте{" "}
              <span className="text-primary">{Math.ceil(dailyPlan)}</span>{" "}
              {goal.linked_counter_type === "salawat"
                ? "салаватов"
                : goal.category === "quran"
                ? "страниц"
                : goal.category === "prayer"
                ? "намазов"
                : "раз"}{" "}
              в день
            </p>
          </div>
        )}

        {/* Дедлайн */}
        {daysUntilDeadline !== null && goal.status === "active" && (
          <div className="text-sm">
            <p className={cn(
              "font-semibold",
              daysUntilDeadline <= 3 && "text-destructive",
              daysUntilDeadline <= 7 && daysUntilDeadline > 3 && "text-yellow-600"
            )}>
              {daysUntilDeadline === 0
                ? "Срок истек"
                : daysUntilDeadline === 1
                ? "Остался 1 день"
                : `Осталось ${daysUntilDeadline} дней`}
            </p>
          </div>
        )}

        {/* Быстрые действия */}
        <div className="flex gap-2 pt-2">
          {isLinkedToTasbih && goal.status === "active" ? (
            <Button
              variant="default"
              className="flex-1 min-w-0"
              onClick={onGoToTasbih}
            >
              <Sparkles className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">Перейти к тасбиху</span>
            </Button>
          ) : goal.status === "active" ? (
            <Button
              variant="default"
              className="flex-1 min-w-0"
              onClick={onMarkComplete}
            >
              <CheckCircle2 className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">Отметить выполнение</span>
            </Button>
          ) : null}

          {goal.status === "paused" && (
            <Button
              variant="outline"
              className="flex-1 min-w-0"
              onClick={onEdit}
            >
              <Play className="h-4 w-4 mr-2 shrink-0" />
              <span className="truncate">Возобновить</span>
            </Button>
          )}
        </div>

        {/* Индикатор связи с тасбихом */}
        {isLinkedToTasbih && goal.status === "active" && (
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>Связано с умным тасбихом</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

