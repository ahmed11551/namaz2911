// Страница Статистики - дизайн Fintrack (тёмная тема)

import { useState, useEffect } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import {
  ArrowLeft,
  Flame,
  Trophy,
  Target,
  TrendingUp,
  BookOpen,
  Award,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { spiritualPathAPI } from "@/lib/api";
import { useUserData } from "@/hooks/useUserData";
import type { Goal, Streak, Badge } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { format, startOfWeek, eachDayOfInterval } from "date-fns";
import { ru } from "date-fns/locale";

// Информация о бейджах
const BADGE_INFO: Record<string, { label: string; icon: string; color: string }> = {
  prayer_consistency: { label: "Неуклонный в намазе", icon: "🕌", color: "bg-emerald-500" },
  quran_completion: { label: "Сердце Корана", icon: "📖", color: "bg-blue-500" },
  sadaqa_regularity: { label: "Рука щедрости", icon: "💝", color: "bg-pink-500" },
  zikr_consistency: { label: "Поминающий", icon: "📿", color: "bg-purple-500" },
  streak_master: { label: "Мастер серий", icon: "🔥", color: "bg-orange-500" },
  goal_achiever: { label: "Достигатель", icon: "🎯", color: "bg-yellow-500" },
};

const LEVEL_COLORS = {
  copper: "bg-amber-600",
  silver: "bg-gray-400",
  gold: "bg-yellow-500",
  platinum: "bg-cyan-400",
};

const Statistics = () => {
  const navigate = useNavigate();
  const { userData } = useUserData();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    loadData();
    
    // Слушаем события обновления данных
    const handleGoalsUpdate = () => loadData();
    window.addEventListener('goalsUpdated', handleGoalsUpdate);
    window.addEventListener('focus', handleGoalsUpdate);
    
    return () => {
      window.removeEventListener('goalsUpdated', handleGoalsUpdate);
      window.removeEventListener('focus', handleGoalsUpdate);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Загружаем данные параллельно, но обрабатываем ошибки для каждого отдельно
      const results = await Promise.allSettled([
        spiritualPathAPI.getGoals("all"),
        spiritualPathAPI.getStreaks(),
        spiritualPathAPI.getBadges(),
      ]);

      // Обрабатываем цели
      if (results[0].status === "fulfilled") {
        const allGoals = results[0].value;
        setGoals(allGoals);
      } else {
        console.error("Error loading goals:", results[0].reason);
        // Пытаемся загрузить из localStorage
        try {
          const cachedGoals = spiritualPathAPI.getGoalsFromLocalStorage("all");
          if (cachedGoals.length > 0) {
            setGoals(cachedGoals);
          }
        } catch (e) {
          console.warn("Error loading cached goals:", e);
        }
      }

      // Обрабатываем streaks
      if (results[1].status === "fulfilled") {
        setStreaks(results[1].value);
        // Вычисляем активность по дням недели
        const activity = [0, 0, 0, 0, 0, 0, 0];
        const dailyStreak = results[1].value.find(s => s.streak_type === "daily_all");
        if (dailyStreak && dailyStreak.current_streak > 0) {
          for (let i = 0; i < Math.min(dailyStreak.current_streak, 7); i++) {
            activity[6 - i] = 100;
          }
        }
        setWeeklyActivity(activity);
      } else {
        console.error("Error loading streaks:", results[1].reason);
        setStreaks([]);
        setWeeklyActivity([0, 0, 0, 0, 0, 0, 0]);
      }

      // Обрабатываем badges
      if (results[2].status === "fulfilled") {
        setBadges(results[2].value);
      } else {
        console.error("Error loading badges:", results[2].reason);
        setBadges([]);
      }
    } catch (error) {
      console.error("Unexpected error loading data:", error);
      // Пытаемся загрузить хотя бы из localStorage
      try {
        const cachedGoals = spiritualPathAPI.getGoalsFromLocalStorage("all");
        if (cachedGoals.length > 0) {
          setGoals(cachedGoals);
        }
      } catch (e) {
        console.warn("Error loading cached goals:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  // Статистика
  const currentStreak = streaks.find(s => s.streak_type === "daily_all")?.current_streak || 0;
  const longestStreak = streaks.find(s => s.streak_type === "daily_all")?.longest_streak || 0;
  const completedGoals = goals.filter(g => g.status === "completed").length;
  const learnedGoals = goals.filter(g => g.status === "completed" && g.is_learning).length;
  const activeGoals = goals.filter(g => g.status === "active").length;
  const totalProgress = goals.reduce((sum, g) => sum + g.current_value, 0);

  // Мотивационное сообщение для страйка
  const getStreakMotivation = (streak: number): string => {
    if (streak === 0) return "Начните серию сегодня!";
    if (streak === 1) return "Отличное начало! Продолжайте завтра";
    if (streak < 7) return `Ма ша Аллах! У тебя серия ${streak} ${streak === 1 ? "день" : streak < 5 ? "дня" : "дней"} подряд - не останавливайся!`;
    if (streak < 30) return `Потрясающе! ${streak} дней подряд - ты на правильном пути!`;
    return `Невероятно! ${streak} дней подряд - ты настоящий мастер!`;
  };

  // Каза статистика
  const qazaTotal = userData?.debt_calculation?.missed_prayers
    ? Object.values(userData.debt_calculation.missed_prayers).reduce((a, b) => a + (b || 0), 0)
    : 0;
  const qazaCompleted = userData?.repayment_progress?.completed_prayers
    ? Object.values(userData.repayment_progress.completed_prayers).reduce((a, b) => a + (b || 0), 0)
    : 0;
  const qazaPercent = qazaTotal > 0 ? Math.round((qazaCompleted / qazaTotal) * 100) : 0;

  const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <MainHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">Загрузка...</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <MainHeader />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-card border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Статистика</h1>
        </div>

        {/* Streak Card - Fintrack style with motivation */}
        <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white/70 text-sm mb-1">Текущая серия</p>
                <p className="text-5xl font-bold">{currentStreak}</p>
                <p className="text-white/70 text-sm mt-1">дней подряд</p>
              </div>
              <div className="text-right">
                <Flame className="w-16 h-16 text-white/30" />
                <p className="text-white/70 text-xs mt-2">Рекорд: {longestStreak} дн.</p>
              </div>
            </div>
            {currentStreak > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className="text-white/90 text-sm font-medium">
                  {getStreakMotivation(currentStreak)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Активность за неделю</h2>
          <div className="flex items-end justify-between gap-2 h-24">
            {weekDays.map((day, i) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "w-full rounded-lg transition-all",
                    weeklyActivity[i] > 0 ? "bg-primary" : "bg-secondary"
                  )}
                  style={{ height: `${Math.max(weeklyActivity[i], 20)}%` }}
                />
                <span className="text-xs text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Calendar */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              {format(new Date(), "LLLL yyyy", { locale: ru })}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Активный день</span>
            </div>
          </div>
          
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((d) => (
              <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">
                {d}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {(() => {
              const today = new Date();
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
              const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              const startPadding = (firstDay.getDay() + 6) % 7;
              const days = [];
              
              for (let i = 0; i < startPadding; i++) {
                days.push(<div key={`empty-${i}`} className="aspect-square" />);
              }
              
              for (let d = 1; d <= lastDay.getDate(); d++) {
                const isToday = d === today.getDate();
                const isActive = d <= today.getDate() && (today.getDate() - d) < currentStreak;
                
                days.push(
                  <div
                    key={d}
                    className={cn(
                      "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
                      isToday && "ring-2 ring-primary",
                      isActive && "bg-primary text-primary-foreground",
                      !isActive && d <= today.getDate() && "bg-secondary text-muted-foreground",
                      d > today.getDate() && "text-muted-foreground/50"
                    )}
                  >
                    {d}
                  </div>
                );
              }
              
              return days;
            })()}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">дней подряд</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{longestStreak}</p>
              <p className="text-xs text-muted-foreground">рекорд</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Целей</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeGoals + completedGoals}</p>
            <p className="text-xs text-primary">{completedGoals} выполнено</p>
          </div>

          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-muted-foreground">Прогресс</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalProgress}</p>
            <p className="text-xs text-blue-400">всего действий</p>
          </div>

          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-muted-foreground">Каза</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{qazaPercent}%</p>
            <p className="text-xs text-purple-400">{qazaCompleted} из {qazaTotal}</p>
          </div>

          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-sm text-muted-foreground">Бейджей</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{badges.length}</p>
            <p className="text-xs text-yellow-400">получено</p>
          </div>
        </div>

        {/* Выученные цели */}
        {learnedGoals > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border/50 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Выученные
              </h2>
              <span className="text-sm text-muted-foreground">{learnedGoals} выучено</span>
            </div>
            <div className="space-y-2">
              {goals
                .filter(g => g.status === "completed" && g.is_learning)
                .slice(0, 5)
                .map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-xl"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{goal.title}</p>
                        {goal.item_data?.arabic && (
                          <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">
                            {goal.item_data.arabic}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2 flex-shrink-0 border-green-500/50 text-green-600">
                      Выучено
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Badges Section with improved gradation */}
        <div className="bg-card rounded-2xl p-5 border border-border/50 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Достижения</h2>
            <span className="text-sm text-muted-foreground">{badges.length} / 18</span>
          </div>
          
          {badges.length > 0 ? (
            <div className="space-y-4">
              {/* Группируем бейджи по типу */}
              {Object.entries(BADGE_INFO).map(([badgeType, info]) => {
                const typeBadges = badges.filter(b => b.badge_type === badgeType);
                if (typeBadges.length === 0) return null;

                return (
                  <div key={badgeType} className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {info.label}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {["copper", "silver", "gold"].map((level) => {
                        const badge = typeBadges.find(b => b.level === level);
                        const levelColor = LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || "bg-gray-400";
                        
                        return (
                          <div
                            key={level}
                            className={cn(
                              "flex flex-col items-center p-3 rounded-xl transition-all",
                              badge
                                ? "bg-secondary"
                                : "bg-secondary/30 opacity-50"
                            )}
                          >
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center text-xl mb-2",
                              badge ? levelColor + "/20" : "bg-muted"
                            )}>
                              {badge ? info.icon : "🔒"}
                            </div>
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full text-white mt-1",
                              badge ? levelColor : "bg-muted"
                            )}>
                              {level === "copper" ? "Бронза" : level === "silver" ? "Серебро" : "Золото"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Выполняйте цели, чтобы получить достижения
              </p>
            </div>
          )}
        </div>

        {/* Streaks by Category */}
        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <h2 className="font-semibold text-foreground mb-4">Серии по категориям</h2>
          
          {streaks.filter(s => s.streak_type === "category").length > 0 ? (
            <div className="space-y-3">
              {streaks
                .filter(s => s.streak_type === "category")
                .map((streak) => (
                  <div
                    key={streak.id}
                    className="flex items-center justify-between p-3 bg-secondary rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground capitalize">
                          {streak.category || "Общая"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Рекорд: {streak.longest_streak} дн.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-orange-400">
                        {streak.current_streak}
                      </p>
                      <p className="text-xs text-muted-foreground">дней</p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                Начните выполнять цели, чтобы видеть серии
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Statistics;
