// Карточка привычки из каталога

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import type { Habit } from "@/data/habits-catalog";
import { getDifficultyLabel, getDifficultyColor, getCategoryColor } from "@/data/habits-catalog";
import { cn } from "@/lib/utils";

interface HabitCardProps {
  habit: Habit;
  onAdd: (habit: Habit) => void;
  onInfo?: (habit: Habit) => void;
}

export const HabitCard = ({ habit, onAdd, onInfo }: HabitCardProps) => {
  const difficultyColor = getDifficultyColor(habit.difficulty);
  const categoryColor = getCategoryColor(habit.category);

  return (
    <Card className="group hover:shadow-md transition-all duration-200 border-2 border-gray-200 hover:border-green-300 bg-white relative overflow-hidden">
      {/* Цветовой маркер слева */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        categoryColor === "green" && "bg-green-500",
        categoryColor === "blue" && "bg-blue-500",
        categoryColor === "purple" && "bg-purple-500",
        categoryColor === "pink" && "bg-pink-500",
        categoryColor === "amber" && "bg-amber-500",
        categoryColor === "cyan" && "bg-cyan-500",
        categoryColor === "rose" && "bg-rose-500"
      )} />
      <CardContent className="p-4 pl-5">
        <div className="flex items-start gap-3">
          {/* Иконка и цветовой маркер */}
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2",
            categoryColor === "green" && "bg-green-500/10 border-green-500/20",
            categoryColor === "blue" && "bg-blue-500/10 border-blue-500/20",
            categoryColor === "purple" && "bg-purple-500/10 border-purple-500/20",
            categoryColor === "pink" && "bg-pink-500/10 border-pink-500/20",
            categoryColor === "amber" && "bg-amber-500/10 border-amber-500/20",
            categoryColor === "cyan" && "bg-cyan-500/10 border-cyan-500/20",
            categoryColor === "rose" && "bg-rose-500/10 border-rose-500/20"
          )}>
            {habit.icon}
          </div>

          {/* Контент */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1">
                  {habit.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  {habit.description}
                </p>
              </div>
            </div>

            {/* Теги и сложность */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <Badge
                variant="outline"
                className={cn(
                  "text-xs flex items-center gap-1",
                  difficultyColor === "green" && "border-green-500/30 text-green-600",
                  difficultyColor === "yellow" && "border-yellow-500/30 text-yellow-600",
                  difficultyColor === "blue" && "border-blue-500/30 text-blue-600"
                )}
              >
                <span className={cn(
                  "w-2 h-2 rounded-full",
                  difficultyColor === "green" && "bg-green-500",
                  difficultyColor === "yellow" && "bg-yellow-500",
                  difficultyColor === "blue" && "bg-blue-500"
                )} />
                {getDifficultyLabel(habit.difficulty)}
              </Badge>
              {habit.defaultPeriod && (
                <Badge variant="outline" className="text-xs">
                  {habit.defaultPeriod === "daily" ? "Ежедневно" :
                   habit.defaultPeriod === "weekly" ? "Еженедельно" :
                   "Ежемесячно"}
                </Badge>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => onAdd(habit)}
                size="sm"
                className="flex-1 rounded-lg text-xs sm:text-sm"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                Добавить
              </Button>
              {onInfo && (
                <Button
                  onClick={() => onInfo(habit)}
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                >
                  <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

