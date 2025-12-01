// Виджет аналитики для целей - переключатель Неделя/Месяц
import { useState, useMemo } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Flame,
  Target,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Goal, Streak } from "@/types/spiritual-path";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";

interface AnalyticsWidgetProps {
  goals: Goal[];
  streaks: Streak[];
  className?: string;
}

type Period = "week" | "month";

interface CategoryStreak {
  category: string;
  label: string;
  icon: string;
  current: number;
  longest: number;
  color: string;
}

const CATEGORY_INFO: Record<string, { label: string; icon: string; color: string }> = {
  prayer: { label: "Намаз", icon: "🕌", color: "from-emerald-500 to-teal-600" },
  quran: { label: "Коран", icon: "📖", color: "from-blue-500 to-indigo-600" },
  zikr: { label: "Зикр", icon: "📿", color: "from-purple-500 to-violet-600" },
  sadaqa: { label: "Садака", icon: "💝", color: "from-pink-500 to-rose-600" },
  fasting: { label: "Пост", icon: "🌙", color: "from-amber-500 to-orange-600" },
  knowledge: { label: "Знания", icon: "📚", color: "from-cyan-500 to-blue-600" },
  other: { label: "Другое", icon: "✨", color: "from-gray-500 to-slate-600" },
};

export const AnalyticsWidget = ({ goals, streaks, className }: AnalyticsWidgetProps) => {
  const [period, setPeriod] = useState<Period>("week");
  const today = new Date();

  // Вычисление периода
  const dateRange = useMemo(() => {
    if (period === "week") {
      return {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      };
    }
    return {
      start: startOfMonth(today),
      end: endOfMonth(today),
    };
  }, [period, today]);

  // Дни в периоде
  const daysInPeriod = useMemo(() => {
    return eachDayOfInterval(dateRange);
  }, [dateRange]);

  // Статистика по дням
  const dailyStats = useMemo(() => {
    return daysInPeriod.map(day => {
      const dayGoals = goals.filter(g => 
        g.updated_at && isWithinInterval(new Date(g.updated_at), {
          start: new Date(day.setHours(0, 0, 0, 0)),
          end: new Date(day.setHours(23, 59, 59, 999)),
        })
      );
      const completed = dayGoals.filter(g => g.status === "completed").length;
      const total = dayGoals.length || 1;
      return {
        date: day,
        completed,
        total,
        percentage: Math.round((completed / total) * 100),
      };
    });
  }, [daysInPeriod, goals]);

  // Серии по категориям
  const categoryStreaks = useMemo((): CategoryStreak[] => {
    const categories = new Set(goals.map(g => g.category || "other"));
    
    return Array.from(categories).map(cat => {
      const catGoals = goals.filter(g => (g.category || "other") === cat);
      const streak = streaks.find(s => s.streak_type === `category_${cat}`);
      const info = CATEGORY_INFO[cat] || CATEGORY_INFO.other;
      
      // Вычисляем серию на основе completed goals
      let currentStreak = 0;
      const sortedGoals = catGoals
        .filter(g => g.status === "completed")
        .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
      
      if (sortedGoals.length > 0) {
        // Простая логика: считаем последовательные дни выполнения
        currentStreak = streak?.current_streak || sortedGoals.length;
      }
      
      return {
        category: cat,
        label: info.label,
        icon: info.icon,
        current: currentStreak,
        longest: streak?.longest_streak || currentStreak,
        color: info.color,
      };
    }).sort((a, b) => b.current - a.current);
  }, [goals, streaks]);

  // Общая статистика
  const stats = useMemo(() => {
    const activeGoals = goals.filter(g => g.status === "active").length;
    const completedGoals = goals.filter(g => g.status === "completed").length;
    const totalProgress = goals.reduce((sum, g) => sum + (g.current_value || 0), 0);
    const totalTarget = goals.reduce((sum, g) => sum + (g.target_value || 1), 0);
    const avgCompletion = Math.round((totalProgress / totalTarget) * 100);
    
    // Тренд (сравнение с прошлым периодом)
    const trend = completedGoals > 0 ? "up" : "stable";
    
    return {
      activeGoals,
      completedGoals,
      avgCompletion,
      trend,
    };
  }, [goals]);

  return (
    <div className={cn("bg-card rounded-2xl border border-border/50 p-4", className)}>
      {/* Header с переключателем */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Аналитика</h3>
            <p className="text-xs text-muted-foreground">
              {format(dateRange.start, "d MMM", { locale: ru })} - {format(dateRange.end, "d MMM", { locale: ru })}
            </p>
          </div>
        </div>
        
        {/* Переключатель Неделя/Месяц */}
        <div className="flex bg-secondary rounded-xl p-1">
          <button
            onClick={() => setPeriod("week")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
              period === "week" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Неделя
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
              period === "month" 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Месяц
          </button>
        </div>
      </div>

      {/* Быстрая статистика */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">{stats.activeGoals}</p>
          <p className="text-[10px] text-muted-foreground">Активных</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">{stats.completedGoals}</p>
          <p className="text-[10px] text-muted-foreground">Выполнено</p>
        </div>
        <div className="bg-secondary/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            {stats.trend === "up" ? (
              <TrendingUp className="w-4 h-4 text-primary" />
            ) : (
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <p className="text-lg font-bold text-foreground">{stats.avgCompletion}%</p>
          <p className="text-[10px] text-muted-foreground">Прогресс</p>
        </div>
      </div>

      {/* График активности */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">Активность</p>
        <div className="flex gap-1 justify-between">
          {dailyStats.slice(0, period === "week" ? 7 : 14).map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              <div 
                className={cn(
                  "w-full rounded-sm transition-all",
                  day.percentage > 75 ? "bg-primary" :
                  day.percentage > 50 ? "bg-primary/70" :
                  day.percentage > 25 ? "bg-primary/40" :
                  day.percentage > 0 ? "bg-primary/20" : "bg-secondary"
                )}
                style={{ height: `${Math.max(day.percentage * 0.4, 8)}px` }}
              />
              <span className="text-[8px] text-muted-foreground">
                {format(day.date, period === "week" ? "EE" : "d", { locale: ru })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Серии по категориям */}
      {categoryStreaks.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Flame className="w-3 h-3" />
            Серии по категориям
          </p>
          <div className="space-y-2">
            {categoryStreaks.slice(0, 4).map(cat => (
              <div key={cat.category} className="flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{cat.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {cat.current} дн. / макс: {cat.longest}
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full bg-gradient-to-r", cat.color)}
                      style={{ width: `${Math.min((cat.current / Math.max(cat.longest, 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

