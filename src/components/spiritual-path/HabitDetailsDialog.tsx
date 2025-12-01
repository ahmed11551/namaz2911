// Диалог с детальной информацией о привычке

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, BookOpen, Sparkles, Clock } from "lucide-react";
import type { Habit } from "@/data/habits-catalog";
import { getDifficultyLabel, getDifficultyColor, getCategoryColor } from "@/data/habits-catalog";
import { cn } from "@/lib/utils";

interface HabitDetailsDialogProps {
  habit: Habit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: () => void;
}

export const HabitDetailsDialog = ({
  habit,
  open,
  onOpenChange,
  onAdd,
}: HabitDetailsDialogProps) => {
  const difficultyColor = getDifficultyColor(habit.difficulty);
  const categoryColor = getCategoryColor(habit.category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border-2",
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
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl">{habit.title}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm mt-1">
                {habit.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Теги и сложность */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(
                "text-xs flex items-center gap-1.5",
                difficultyColor === "green" && "border-green-500/30 text-green-600",
                difficultyColor === "yellow" && "border-yellow-500/30 text-yellow-600",
                difficultyColor === "blue" && "border-blue-500/30 text-blue-600"
              )}
            >
              <span className={cn(
                "w-2.5 h-2.5 rounded-full",
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
            {habit.defaultTarget && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {habit.defaultTarget} {habit.defaultPeriod === "daily" ? "в день" :
                                       habit.defaultPeriod === "weekly" ? "в неделю" :
                                       "в месяц"}
              </Badge>
            )}
          </div>

          {/* Польза и хадис */}
          {habit.benefit && (
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 space-y-2 border border-primary/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-sm text-foreground">Польза</h4>
              </div>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                {habit.benefit}
              </p>
            </div>
          )}

          {habit.hadith && (
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-4 space-y-2 border border-amber-500/20">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <h4 className="font-semibold text-sm text-foreground">Хадис</h4>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed">
                "{habit.hadith}"
              </p>
            </div>
          )}

          {/* Рекомендации */}
          {habit.recommendedFor && habit.recommendedFor.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Рекомендуется для:</p>
              <div className="flex gap-2 flex-wrap">
                {habit.recommendedFor.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag === "beginners" ? "Для начинающих" :
                     tag === "women" ? "Женщинам" :
                     tag === "youth" ? "Молодёжи" :
                     tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Кнопка добавления */}
          <Button
            onClick={onAdd}
            className="w-full rounded-xl"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить эту привычку
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

