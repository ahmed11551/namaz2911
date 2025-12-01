// AI-рекомендации на основе прогресса пользователя
import { useMemo } from "react";
import { 
  Sparkles, 
  Lightbulb, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  Flame,
  Target,
  BookOpen,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Goal, Streak } from "@/types/spiritual-path";
import { useNavigate } from "react-router-dom";

interface AIRecommendationsProps {
  goals: Goal[];
  streaks: Streak[];
  className?: string;
}

interface Recommendation {
  id: string;
  type: "tip" | "warning" | "motivation" | "suggestion";
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  action?: {
    label: string;
    path?: string;
    onClick?: () => void;
  };
}

export const AIRecommendations = ({ goals, streaks, className }: AIRecommendationsProps) => {
  const navigate = useNavigate();

  const recommendations = useMemo((): Recommendation[] => {
    const recs: Recommendation[] = [];
    
    // Анализ целей
    const activeGoals = goals.filter(g => g.status === "active");
    const completedGoals = goals.filter(g => g.status === "completed");
    const nearComplete = activeGoals.filter(g => {
      const progress = (g.current_value || 0) / (g.target_value || 1);
      return progress >= 0.8 && progress < 1;
    });
    const lowProgress = activeGoals.filter(g => {
      const progress = (g.current_value || 0) / (g.target_value || 1);
      return progress < 0.2 && g.target_value > 0;
    });
    
    // Анализ серий
    const mainStreak = streaks.find(s => s.streak_type === "daily_all");
    const currentStreak = mainStreak?.current_streak || 0;
    
    // Категории
    const categories = new Set(goals.map(g => g.category));
    const hasQuran = categories.has("quran");
    const hasZikr = categories.has("zikr");
    const hasPrayer = categories.has("prayer");
    
    // 1. Цели близки к завершению
    if (nearComplete.length > 0) {
      recs.push({
        id: "near-complete",
        type: "motivation",
        icon: Target,
        iconColor: "text-primary",
        title: `${nearComplete.length} ${nearComplete.length === 1 ? "цель" : "целей"} почти выполнены!`,
        description: `Осталось совсем немного до завершения "${nearComplete[0].title}"`,
        action: {
          label: "Продолжить",
          path: "/goals",
        },
      });
    }
    
    // 2. Серия под угрозой
    if (currentStreak > 0 && currentStreak >= 3) {
      recs.push({
        id: "streak-warning",
        type: "warning",
        icon: Flame,
        iconColor: "text-orange-500",
        title: `Сохраните серию ${currentStreak} дней!`,
        description: "Не забудьте выполнить хотя бы одну цель сегодня",
        action: {
          label: "Выполнить",
          path: "/tasbih",
        },
      });
    }
    
    // 3. Предложение добавить Коран
    if (!hasQuran && goals.length > 0) {
      recs.push({
        id: "add-quran",
        type: "suggestion",
        icon: BookOpen,
        iconColor: "text-blue-500",
        title: "Добавьте чтение Корана",
        description: "Ежедневное чтение хотя бы одного аята — это великая награда",
        action: {
          label: "Добавить цель",
          path: "/goals",
        },
      });
    }
    
    // 4. Предложение добавить зикр
    if (!hasZikr && goals.length > 0) {
      recs.push({
        id: "add-zikr",
        type: "suggestion",
        icon: Heart,
        iconColor: "text-purple-500",
        title: "Добавьте ежедневный зикр",
        description: "33 раза СубханАллах — это легко и даёт огромную награду",
        action: {
          label: "Начать тасбих",
          path: "/tasbih",
        },
      });
    }
    
    // 5. Низкий прогресс
    if (lowProgress.length > 0) {
      recs.push({
        id: "low-progress",
        type: "tip",
        icon: Lightbulb,
        iconColor: "text-amber-500",
        title: "Совет: уменьшите цели",
        description: `"${lowProgress[0].title}" — попробуйте начать с меньших шагов`,
      });
    }
    
    // 6. Поздравление с достижениями
    if (completedGoals.length >= 5 && recs.length < 2) {
      recs.push({
        id: "achievement",
        type: "motivation",
        icon: Sparkles,
        iconColor: "text-primary",
        title: "Машаллах! Отличный прогресс!",
        description: `Вы выполнили ${completedGoals.length} целей. Продолжайте в том же духе!`,
      });
    }
    
    // 7. Нет активных целей
    if (activeGoals.length === 0) {
      recs.push({
        id: "no-goals",
        type: "suggestion",
        icon: Target,
        iconColor: "text-primary",
        title: "Создайте новую цель",
        description: "Начните с малого: ежедневный зикр или чтение Корана",
        action: {
          label: "Создать",
          path: "/goals",
        },
      });
    }
    
    // 8. Общий совет (если мало рекомендаций)
    if (recs.length < 2) {
      const tips = [
        {
          title: "Лучшее время для дуа",
          description: "Последняя треть ночи — когда Аллах спускается на ближнее небо",
          icon: Lightbulb,
        },
        {
          title: "Сила регулярности",
          description: "Малые, но постоянные дела лучше больших и прерывающихся",
          icon: TrendingUp,
        },
        {
          title: "Намерение — ключ",
          description: "Обновляйте намерение перед каждым делом для большей награды",
          icon: Sparkles,
        },
      ];
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      recs.push({
        id: "daily-tip",
        type: "tip",
        icon: randomTip.icon,
        iconColor: "text-amber-500",
        title: randomTip.title,
        description: randomTip.description,
      });
    }
    
    return recs.slice(0, 3); // Максимум 3 рекомендации
  }, [goals, streaks]);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className={cn("bg-card rounded-2xl border border-border/50 p-4", className)}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">AI Рекомендации</h3>
          <p className="text-[10px] text-muted-foreground">На основе вашего прогресса</p>
        </div>
      </div>

      <div className="space-y-2">
        {recommendations.map(rec => {
          const Icon = rec.icon;
          return (
            <div 
              key={rec.id}
              className={cn(
                "p-3 rounded-xl transition-all",
                rec.type === "warning" ? "bg-amber-500/10 border border-amber-500/20" :
                rec.type === "motivation" ? "bg-primary/10 border border-primary/20" :
                "bg-secondary/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  rec.type === "warning" ? "bg-amber-500/20" :
                  rec.type === "motivation" ? "bg-primary/20" :
                  "bg-secondary"
                )}>
                  <Icon className={cn("w-4 h-4", rec.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{rec.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                  
                  {rec.action && (
                    <button
                      onClick={() => rec.action?.path && navigate(rec.action.path)}
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      {rec.action.label}
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

