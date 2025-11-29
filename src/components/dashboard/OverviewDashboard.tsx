// Обзор - дизайн в стиле Fintrack с анимациями

import { useEffect, useMemo, useState, useRef } from "react";
import { useUserData } from "@/hooks/useUserData";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal, Streak } from "@/types/spiritual-path";
import {
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Target,
  Check,
  Sparkles,
  BookOpen,
  Star,
  Moon,
  Sun,
  Heart,
  ChevronRight,
  TrendingUp,
  Zap,
  Award,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PrayerTimesWidget } from "@/components/prayer/PrayerTimesWidget";
import { AyahOfTheDay } from "@/components/quran/AyahOfTheDay";
import { WeeklyChallenges } from "@/components/challenges/WeeklyChallenges";
import { getNamesOfAllah } from "@/lib/dhikr-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, isToday, isTomorrow, addDays, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";

const computePrayerProgress = (userData: ReturnType<typeof useUserData>["userData"]) => {
  if (!userData) {
    return { percent: 0, completed: 0, total: 0, remaining: 0 };
  }

  const { debt_calculation, repayment_progress } = userData;
  const total =
    Object.values(debt_calculation?.missed_prayers || {}).reduce(
      (acc, value) => acc + (value || 0),
      0
    ) || 0;
  const completed =
    Object.values(repayment_progress?.completed_prayers || {}).reduce(
      (acc, value) => acc + (value || 0),
      0
    ) || 0;

  const percent = total > 0 ? Math.min(100, (completed / total) * 100) : 0;
  return { percent, completed, total, remaining: Math.max(total - completed, 0) };
};

// Animated Number Component
const AnimatedNumber = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(startValue + (endValue - startValue) * easeOutQuart);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className="tabular-nums">{displayValue.toLocaleString()}</span>;
};

// Иконки для разных категорий
const getCategoryIcon = (category: string, title: string) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes("утренн") || lowerTitle.includes("фаджр")) {
    return <Sun className="w-5 h-5" />;
  }
  if (lowerTitle.includes("вечерн") || lowerTitle.includes("магриб")) {
    return <Moon className="w-5 h-5" />;
  }
  if (lowerTitle.includes("коран") || lowerTitle.includes("чтени")) {
    return <BookOpen className="w-5 h-5" />;
  }
  if (lowerTitle.includes("зикр") || lowerTitle.includes("тасбих")) {
    return <Sparkles className="w-5 h-5" />;
  }
  if (lowerTitle.includes("благ") || lowerTitle.includes("садак")) {
    return <Heart className="w-5 h-5" />;
  }
  if (category === "zikr") {
    return <Star className="w-5 h-5" />;
  }
  return <Sparkles className="w-5 h-5" />;
};

// Компонент карточки цели с анимациями
const GoalCard = ({ goal, onClick, index }: { goal: Goal; onClick: () => void; index: number }) => {
  const progress = goal.target_value > 0 
    ? (goal.current_value / goal.target_value) * 100 
    : 0;
  const isComplete = goal.current_value >= goal.target_value;
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full bg-card rounded-2xl p-4 border border-border/50",
        "hover:border-primary/30 transition-all duration-300",
        "flex items-center gap-4 text-left",
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 magnetic",
        isComplete 
          ? "bg-primary/20 text-primary" 
          : "bg-secondary text-muted-foreground"
      )}>
        {getCategoryIcon(goal.category, goal.title)}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground mb-2 truncate text-sm">
          {goal.title}
        </h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 progress-animate",
                isComplete ? "bg-primary" : "bg-primary/70"
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
            {goal.current_value}/{goal.target_value}
          </span>
        </div>
      </div>

      {isComplete ? (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 bounce-in">
          <Check className="w-4 h-4 text-primary-foreground" />
        </div>
      ) : (
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      )}
    </button>
  );
};

// Компонент статистики с анимациями
const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  trendUp,
  gradient,
  onClick,
  delay = 0
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  gradient: string;
  onClick?: () => void;
  delay?: number;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "bg-card rounded-2xl p-4 border border-border/50 text-left",
      "hover:border-primary/30 transition-all duration-300",
    )}
  >
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center mb-3 magnetic subtle-float",
      gradient
    )}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <p className="text-2xl font-bold text-foreground mb-1">
      {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
    </p>
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {trend && (
        <span className={cn(
          "text-[10px] font-medium flex items-center gap-0.5",
          trendUp ? "text-primary" : "text-destructive"
        )}>
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </span>
      )}
    </div>
  </button>
);

interface OverviewDashboardProps {
  onNavigateToCalculator?: () => void;
}

export const OverviewDashboard = ({ onNavigateToCalculator }: OverviewDashboardProps) => {
  const navigate = useNavigate();
  const { userData, loading } = useUserData();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [namesOfAllah, setNamesOfAllah] = useState<Array<{ id: string; arabic: string; translation: string; number: number }>>([]);

  useEffect(() => {
    // Delay content animation
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        // Загружаем данные параллельно, но обрабатываем ошибки для каждого отдельно
        const results = await Promise.allSettled([
          spiritualPathAPI.getGoals("active"),
          spiritualPathAPI.getStreaks(),
          getNamesOfAllah(),
        ]);
        
        if (!mounted) return;
        
        // Обрабатываем цели
        if (results[0].status === "fulfilled") {
          setGoals(results[0].value);
        } else {
          console.error("Failed to load goals:", results[0].reason);
          // Пытаемся загрузить из localStorage
          try {
            const cachedGoals = spiritualPathAPI.getGoalsFromLocalStorage("active");
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
        } else {
          console.error("Failed to load streaks:", results[1].reason);
          setStreaks([]);
        }

        // Обрабатываем 99 имен Аллаха
        if (results[2].status === "fulfilled") {
          const names = results[2].value.slice(0, 3); // Показываем первые 3 имени
          setNamesOfAllah(names.map(n => ({
            id: n.id,
            arabic: n.arabic || "",
            translation: n.translation || "",
            number: n.number || 0
          })));
        }
      } catch (error) {
        console.error("Unexpected error loading dashboard data:", error);
        // Пытаемся загрузить хотя бы из localStorage
        try {
          const cachedGoals = spiritualPathAPI.getGoalsFromLocalStorage("active");
          if (cachedGoals.length > 0) {
            setGoals(cachedGoals);
          }
        } catch (e) {
          console.warn("Error loading cached goals:", e);
        }
      } finally {
        if (mounted) setGoalsLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, []);

  const prayerProgress = useMemo(() => computePrayerProgress(userData), [userData]);
  const currentStreak = streaks.find(s => s.current_streak > 0)?.current_streak || 0;
  
  // Цели на сегодня (первые 3)
  const todayGoals = goals.slice(0, 3);

  if (loading || goalsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary wiggle" />
          </div>
          <p className="text-muted-foreground text-sm">Загрузка...</p>
          {/* Skeleton loading */}
          <div className="w-full max-w-xs space-y-3 mt-4">
            <div className="h-32 skeleton rounded-2xl" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 skeleton rounded-2xl" />
              <div className="h-24 skeleton rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-8", showContent ? "opacity-100" : "opacity-0")} style={{ transition: 'opacity 0.2s' }}>
      {/* Balance Card - Fintrack Style with animations */}
      <div className="balance-card p-6 sm:p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/70 text-sm mb-1">Общий прогресс</p>
            <p className="text-3xl font-bold">
              <AnimatedNumber value={prayerProgress.completed} duration={1500} />
              <span className="text-lg text-white/70 ml-1">намазов</span>
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center subtle-float">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Progress Ring with animation */}
        <div className="flex items-center gap-3 sm:gap-6 mb-6">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke="white"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={214}
                strokeDashoffset={214 - (214 * prayerProgress.percent) / 100}
                className="circle-animate"
                style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                <AnimatedNumber value={Math.round(prayerProgress.percent)} />%
              </span>
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">Выполнено</span>
              <span className="font-semibold"><AnimatedNumber value={prayerProgress.completed} /></span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">Осталось</span>
              <span className="font-semibold"><AnimatedNumber value={prayerProgress.remaining} /></span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">Всего</span>
              <span className="font-semibold"><AnimatedNumber value={prayerProgress.total} /></span>
            </div>
          </div>
        </div>

        {/* Quick Action */}
        <button
          onClick={onNavigateToCalculator}
          className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl text-white font-medium text-sm transition-all flex items-center justify-center gap-2 magnetic ripple"
        >
          Подробнее
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Grid with staggered animations */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Target}
          label="Активных целей"
          value={goals.length}
          trend="+2"
          trendUp={true}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          onClick={() => navigate("/goals")}
          delay={0.1}
        />
        <StatCard
          icon={Flame}
          label="Дней подряд"
          value={currentStreak}
          trend={currentStreak > 0 ? "🔥" : ""}
          trendUp={true}
          gradient="bg-gradient-to-br from-orange-500 to-red-500"
          onClick={() => navigate("/statistics")}
          delay={0.2}
        />
      </div>

      {/* Prayer Times Widget */}
      <PrayerTimesWidget compact city="Москва" />

      {/* 99 имен Аллаха - компактный блок */}
      {namesOfAllah.length > 0 && (
        <Card className="bg-gradient-to-br from-yellow-500/10 via-amber-500/10 to-orange-500/10 border-yellow-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">99 имен Аллаха</h3>
                  <p className="text-xs text-muted-foreground">Асма уль-Хусна</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/goals?category=names_of_allah")}
              >
                Все имена
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {namesOfAllah.map((name) => (
                <div
                  key={name.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer"
                  onClick={() => navigate("/dhikr?item=" + name.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center text-xs font-bold text-yellow-600">
                      {name.number}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{name.arabic}</p>
                      <p className="text-xs text-muted-foreground">{name.translation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Календарь событий с активными целями */}
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Ближайшие цели</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/goals")}
            >
              Все цели
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {goals.length > 0 ? (
            <div className="space-y-2">
              {goals
                .filter(g => g.status === "active" && g.end_date)
                .sort((a, b) => {
                  const dateA = new Date(a.end_date!).getTime();
                  const dateB = new Date(b.end_date!).getTime();
                  return dateA - dateB;
                })
                .slice(0, 3)
                .map((goal) => {
                  const endDate = new Date(goal.end_date!);
                  const daysUntil = differenceInDays(endDate, new Date());
                  const isOverdue = daysUntil < 0;
                  const isUrgent = daysUntil >= 0 && daysUntil <= 3;
                  const progressPercent = goal.target_value > 0
                    ? Math.min(100, (goal.current_value / goal.target_value) * 100)
                    : 0;

                  return (
                    <div
                      key={goal.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all cursor-pointer hover:bg-secondary/50",
                        isOverdue && "border-red-500/50 bg-red-500/5",
                        isUrgent && !isOverdue && "border-yellow-500/50 bg-yellow-500/5",
                        !isOverdue && !isUrgent && "border-border/50"
                      )}
                      onClick={() => navigate(`/goals?goal=${goal.id}`)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm text-foreground truncate">{goal.title}</p>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-xs">Просрочено</Badge>
                            )}
                            {isUrgent && !isOverdue && (
                              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                                Срочно
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {isToday(endDate) && "Сегодня"}
                              {isTomorrow(endDate) && "Завтра"}
                              {!isToday(endDate) && !isTomorrow(endDate) && format(endDate, "dd.MM", { locale: ru })}
                            </div>
                            {daysUntil >= 0 && (
                              <span>{daysUntil === 0 ? "Последний день" : `Осталось ${daysUntil} ${daysUntil === 1 ? "день" : daysUntil < 5 ? "дня" : "дней"}`}</span>
                            )}
                            {isOverdue && (
                              <span className="text-red-500">Просрочено на {Math.abs(daysUntil)} {Math.abs(daysUntil) === 1 ? "день" : "дня"}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isOverdue ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <CheckCircle2 className={cn(
                              "w-5 h-5",
                              isUrgent ? "text-yellow-500" : "text-primary"
                            )} />
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Прогресс</span>
                          <span className="font-medium">{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              isOverdue ? "bg-red-500" : isUrgent ? "bg-yellow-500" : "bg-primary"
                            )}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-3">Нет активных целей</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/goals")}
              >
                Создать цель
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Assistant Card with animations */}
      <button
        onClick={() => navigate("/ai-chat")}
        className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all"
        style={{ animationDelay: '0.3s' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center heartbeat">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white">AI Помощник</h3>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] text-white font-medium">
                BETA
              </span>
            </div>
            <p className="text-white/80 text-sm">
              {goals.length > 0 
                ? `Отличная работа! ${goals.length} целей в процессе`
                : "Создайте первую цель для советов"
              }
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60" />
        </div>
      </button>

      {/* Ayah of the Day */}
      <AyahOfTheDay variant="compact" />

      {/* Weekly Challenges - temporarily disabled */}
      {/* <WeeklyChallenges variant="compact" /> */}

      {/* Today's Goals with staggered animation */}
      {todayGoals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-foreground">Цели на сегодня</h2>
            <button
              onClick={() => navigate("/goals")}
              className="text-primary text-sm font-medium flex items-center gap-1 hover:underline magnetic"
            >
              Все цели
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {todayGoals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={index}
                onClick={() => navigate(`/tasbih?goal=${goal.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions Grid with animations */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/goals")}
          className="bg-card rounded-2xl p-4 border border-border/50 flex items-center gap-3 hover:border-primary/30 transition-all hover-lift ripple slide-up"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 magnetic wiggle-hover">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-foreground block">Новая цель</span>
            <span className="text-xs text-primary">+ Добавить</span>
          </div>
        </button>
        <button
          onClick={() => navigate("/tasbih")}
          className="bg-card rounded-2xl p-4 border border-border/50 flex items-center gap-3 hover:border-primary/30 transition-all hover-lift ripple slide-up"
          style={{ animationDelay: '0.6s' }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 magnetic wiggle-hover">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <span className="text-sm font-semibold text-foreground block">Тасбих</span>
            <span className="text-xs text-purple-400">Начать</span>
          </div>
        </button>
      </div>

      {/* Achievements Preview with animations */}
      <div className="bg-card rounded-2xl p-5 border border-border/50 slide-up" style={{ animationDelay: '0.7s' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-foreground">Достижения</h3>
          <button className="text-primary text-xs font-medium magnetic">Все</button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {[
            { icon: Award, label: "Первые шаги", unlocked: true },
            { icon: Flame, label: "7 дней", unlocked: currentStreak >= 7 },
            { icon: Star, label: "100 намазов", unlocked: prayerProgress.completed >= 100 },
            { icon: Target, label: "5 целей", unlocked: goals.length >= 5 },
          ].map((achievement, i) => (
            <div
              key={i}
              className={cn(
                "flex-shrink-0 w-20 flex flex-col items-center gap-2 p-3 rounded-xl slide-up magnetic",
                achievement.unlocked 
                  ? "bg-primary/10 text-primary" 
                  : "bg-secondary text-muted-foreground opacity-50"
              )}
              style={{ animationDelay: `${0.8 + i * 0.1}s` }}
            >
              <achievement.icon className={cn("w-6 h-6", achievement.unlocked && "heartbeat")} />
              <span className="text-[10px] text-center font-medium">{achievement.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State with animations */}
      {goals.length === 0 && prayerProgress.total === 0 && (
        <div className="bg-card rounded-2xl p-6 sm:p-8 border border-border/50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-primary wiggle" />
          </div>
          <h3 className="font-semibold text-foreground mb-2 text-glow">Начните свой путь</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Рассчитайте долги или создайте первую цель
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={onNavigateToCalculator}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors magnetic ripple"
            >
              Калькулятор
            </button>
            <button 
              onClick={() => navigate("/goals")}
              className="px-5 py-2.5 bg-secondary text-foreground rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors magnetic ripple"
            >
              Цели
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
