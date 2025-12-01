// Страница Цели и Привычки - дизайн Fintrack (тёмная тема)

import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Plus,
  Search,
  Sparkles,
  BookOpen,
  Star,
  Moon,
  Sun,
  Heart,
  Check,
  ChevronRight,
  Minus,
  Trash2,
  Flame,
  Trophy,
  TrendingUp,
  BarChart3,
  Lightbulb,
  Clock,
  Zap,
  CircleDot,
  Target,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal, Streak, Badge } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { CreateGoalDialog } from "@/components/spiritual-path/CreateGoalDialog";
import { SmartGoalTemplates } from "@/components/spiritual-path/SmartGoalTemplates";
import { GoalsByCategory } from "@/components/spiritual-path/GoalsByCategory";
import { useNavigate } from "react-router-dom";
// Упрощённый дизайн - виджеты убраны для лучшей производительности и чистоты интерфейса
// import { AnalyticsWidget } from "@/components/goals/AnalyticsWidget";
// import { AIRecommendations } from "@/components/goals/AIRecommendations";

// Исламские советы дня
const ISLAMIC_TIPS = [
  {
    title: "Лучшее время для дуа",
    description: "Последняя треть ночи — время, когда Аллах спускается на нижнее небо и отвечает на мольбы.",
    icon: Moon,
    color: "from-indigo-500 to-purple-600",
  },
  {
    title: "Сила истигфара",
    description: "Кто много делает истигфар, тому Аллах откроет выход из каждой трудности.",
    icon: Heart,
    color: "from-pink-500 to-rose-600",
  },
  {
    title: "Награда за тасбих",
    description: "33 раза 'СубханАллах', 33 раза 'Альхамдулиллах', 34 раза 'Аллаху Акбар' после намаза — великая награда!",
    icon: Sparkles,
    color: "from-amber-500 to-orange-600",
  },
  {
    title: "Время между азаном",
    description: "Дуа между азаном и икаматом не отвергается. Используйте это время!",
    icon: Clock,
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "Благословенная пятница",
    description: "В пятницу есть час, когда любая дуа принимается. Увеличьте поминание Аллаха!",
    icon: Sun,
    color: "from-yellow-500 to-amber-600",
  },
  {
    title: "Сила Корана",
    description: "Чтение суры 'Аль-Мульк' каждую ночь защищает от мучений в могиле.",
    icon: BookOpen,
    color: "from-cyan-500 to-blue-600",
  },
  {
    title: "Салават пророку ﷺ",
    description: "Кто один раз благословит пророка ﷺ, того Аллах благословит 10 раз.",
    icon: Star,
    color: "from-green-500 to-emerald-600",
  },
];

const getTodayTip = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return ISLAMIC_TIPS[dayOfYear % ISLAMIC_TIPS.length];
};

const getCategoryIcon = (category: string, title: string) => {
  if (!title) return <Star className="w-5 h-5" />;
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

// Цвета для категорий
const getCategoryColors = (category: string) => {
  switch (category) {
    case "prayer": return { gradient: "from-blue-500 to-blue-600", bg: "bg-blue-500/20", text: "text-blue-400" };
    case "quran": return { gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/20", text: "text-emerald-400" };
    case "zikr": return { gradient: "from-purple-500 to-purple-600", bg: "bg-purple-500/20", text: "text-purple-400" };
    case "sadaqa": return { gradient: "from-pink-500 to-pink-600", bg: "bg-pink-500/20", text: "text-pink-400" };
    case "knowledge": return { gradient: "from-amber-500 to-amber-600", bg: "bg-amber-500/20", text: "text-amber-400" };
    default: return { gradient: "from-primary to-primary-dark", bg: "bg-primary/20", text: "text-primary" };
  }
};

// Компонент карточки цели (Fintrack style) - мемоизирован для производительности
const GoalCard = memo(({ 
  goal, 
  onClick,
  onQuickAdd,
}: { 
  goal: Goal; 
  onClick: () => void;
  onQuickAdd?: () => void;
}) => {
  // Защита от некорректных данных
  if (!goal || !goal.title) {
    return null;
  }
  
  const currentValue = goal.current_value || 0;
  const targetValue = goal.target_value || 0;
  const progress = targetValue > 0 
    ? (currentValue / targetValue) * 100 
    : 0;
  const isComplete = currentValue >= targetValue;
  const colors = getCategoryColors(goal.category || "other");
  
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickAdd && !isComplete) {
      onQuickAdd();
    }
  };
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "w-full bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-border/50 cursor-pointer",
        "hover:border-primary/40 hover:shadow-md hover:shadow-primary/10 transition-all duration-200",
        "flex items-center gap-3 sm:gap-4 text-left group",
        isComplete && "ring-2 ring-primary/30 bg-primary/5"
      )}
    >
      {/* Иконка с градиентом - улучшенная */}
      <div className={cn(
        "w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0",
        "shadow-md shadow-black/10",
        `bg-gradient-to-br ${colors.gradient}`
      )}>
        <div className="text-white">
          {getCategoryIcon(goal.category || "other", goal.title || "")}
        </div>
      </div>

      {/* Контент - улучшенный */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
          <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
            {goal.title}
          </h3>
          {isComplete && (
            <span className="text-primary text-lg flex-shrink-0">✓</span>
          )}
        </div>
        
        {/* Прогресс бар - улучшенный */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-1 h-1.5 sm:h-2 bg-secondary/50 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isComplete 
                  ? "bg-gradient-to-r from-primary to-primary-dark" 
                  : "bg-gradient-to-r from-primary/80 to-primary"
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className={cn(
            "text-xs font-semibold whitespace-nowrap flex-shrink-0",
            isComplete ? "text-primary" : "text-muted-foreground"
          )}>
            {currentValue}/{targetValue}
          </span>
        </div>
      </div>

      {/* Кнопка быстрого добавления - улучшенная */}
      <div className="flex-shrink-0">
        {isComplete ? (
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <Check className="w-5 h-5 text-primary-foreground" />
          </div>
        ) : (
          <button
            onClick={handleQuickAdd}
            className={cn(
              "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all",
              "bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground",
              "hover:shadow-md hover:shadow-primary/20 active:scale-95",
              "group-hover:bg-primary/10 group-hover:text-primary"
            )}
            title="Добавить +1"
            aria-label="Добавить прогресс"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Кастомная функция сравнения для оптимизации
  return (
    prevProps.goal.id === nextProps.goal.id &&
    prevProps.goal.current_value === nextProps.goal.current_value &&
    prevProps.goal.status === nextProps.goal.status
  );
});

GoalCard.displayName = "GoalCard";

const Goals = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("active");
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalDetailOpen, setGoalDetailOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const loadingRef = useRef(false); // Защита от повторных вызовов

  // Генерация дней недели
  const weekDays = useMemo(() => {
    const today = new Date();
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date,
        dayName: date.toLocaleDateString("ru", { weekday: "short" }),
        dayNum: date.getDate(),
        isToday: i === 0,
      });
    }
    return days;
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;
    
    // Сначала загружаем из кэша мгновенно (синхронно)
    try {
      const cachedGoals = spiritualPathAPI.getGoalsFromLocalStorage("all");
      if (Array.isArray(cachedGoals) && isMounted) {
        setGoals(cachedGoals);
        setLoading(false); // Показываем страницу сразу с кэшем
      } else if (isMounted) {
        setLoading(false); // Показываем страницу даже если кэш пуст
      }
    } catch (e) {
      console.warn("Error loading cached goals:", e);
      if (isMounted) {
        setLoading(false); // Показываем страницу в любом случае
      }
    }

    // Затем загружаем свежие данные в фоне (асинхронно)
    if (!loadingRef.current && isMounted) {
      // Используем requestIdleCallback для лучшей производительности
      const scheduleLoad = () => {
        if (isMounted && !loadingRef.current) {
          loadData();
        }
      };
      
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        timeoutId = setTimeout(() => {
          window.requestIdleCallback?.(scheduleLoad, { timeout: 200 });
        }, 50);
      } else {
        timeoutId = setTimeout(scheduleLoad, 100);
      }
    }
    
    return () => {
      isMounted = false;
      loadingRef.current = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = useCallback(async () => {
    // Защита от повторных вызовов
    if (loadingRef.current) {
      console.warn("loadData already in progress, skipping");
      return;
    }
    
    loadingRef.current = true;
    // НЕ устанавливаем loading в true, чтобы не блокировать UI
    
    let timeoutId: NodeJS.Timeout | null = null;
    const controller = new AbortController();
    
    try {
      // Загружаем данные параллельно с таймаутом через AbortController
      const loadPromise = Promise.allSettled([
        spiritualPathAPI.getGoals("all").catch((err) => {
          if (controller.signal.aborted) return [];
          console.error("Error in getGoals:", err);
          // Пытаемся загрузить из localStorage при ошибке
          try {
            return spiritualPathAPI.getGoalsFromLocalStorage("all");
          } catch (e) {
            console.warn("Error loading cached goals:", e);
            return [];
          }
        }),
        spiritualPathAPI.getStreaks().catch((err) => {
          if (controller.signal.aborted) return [];
          console.error("Error in getStreaks:", err);
          return [];
        }),
        spiritualPathAPI.getBadges().catch((err) => {
          if (controller.signal.aborted) return [];
          console.error("Error in getBadges:", err);
          return [];
        }),
      ]);

      // Таймаут 2 секунды
      timeoutId = setTimeout(() => {
        controller.abort();
        console.warn("Load data timeout reached");
      }, 2000);

      const results = await loadPromise;

      // Очищаем таймаут
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Если запрос был отменен, не обновляем состояние
      if (controller.signal.aborted) {
        return;
      }

      // Обрабатываем результаты
      // Обрабатываем цели
      if (results[0].status === "fulfilled") {
        const goalsData = Array.isArray(results[0].value) ? results[0].value : [];
        setGoals(goalsData);
      } else {
        console.error("Error loading goals:", results[0].reason);
        // Пытаемся загрузить из localStorage
        try {
          const cachedGoals = spiritualPathAPI.getGoalsFromLocalStorage("all");
          setGoals(Array.isArray(cachedGoals) ? cachedGoals : []);
        } catch (e) {
          console.warn("Error loading cached goals:", e);
          setGoals([]); // Устанавливаем пустой массив при ошибке
        }
        // Не показываем toast на мобильных
        if (window.innerWidth > 640) {
          toast({
            title: "Предупреждение",
            description: "Не удалось загрузить цели с сервера. Используются сохраненные данные.",
            variant: "default",
          });
        }
      }

      // Обрабатываем streaks
      if (results[1].status === "fulfilled") {
        const streaksData = Array.isArray(results[1].value) ? results[1].value : [];
        setStreaks(streaksData);
      } else {
        console.error("Error loading streaks:", results[1].reason);
        setStreaks([]); // Устанавливаем пустой массив по умолчанию
      }

      // Обрабатываем badges
      if (results[2].status === "fulfilled") {
        const badgesData = Array.isArray(results[2].value) ? results[2].value : [];
        setBadges(badgesData);
      } else {
        console.error("Error loading badges:", results[2].reason);
        setBadges([]); // Устанавливаем пустой массив по умолчанию
      }
    } catch (error) {
      // Очищаем таймаут при ошибке
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      console.error("Unexpected error loading data:", error);
      // Пытаемся загрузить хотя бы из localStorage
      try {
        const cachedGoals = spiritualPathAPI.getGoalsFromLocalStorage("all");
        setGoals(Array.isArray(cachedGoals) ? cachedGoals : []);
      } catch (e) {
        console.warn("Error loading cached goals:", e);
        setGoals([]); // Устанавливаем пустой массив при ошибке
      }
      setStreaks([]);
      setBadges([]);
      // Не показываем toast на мобильных
      if (window.innerWidth > 640) {
        toast({
          title: "Ошибка",
          description: "Произошла ошибка при загрузке данных. Используются сохраненные данные.",
          variant: "destructive",
        });
      }
    } finally {
      loadingRef.current = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // НЕ устанавливаем loading в false здесь, так как UI уже показан
    }
  }, [toast]);

  // Статистика (с защитой от undefined/null и мемоизацией)
  const safeStreaks = useMemo(() => Array.isArray(streaks) ? streaks : [], [streaks]);
  const safeGoals = useMemo(() => Array.isArray(goals) ? goals : [], [goals]);
  const safeBadges = useMemo(() => Array.isArray(badges) ? badges : [], [badges]);
  
  const currentStreak = useMemo(() => 
    safeStreaks.find(s => s.streak_type === "daily_all")?.current_streak || 0,
    [safeStreaks]
  );
  const longestStreak = useMemo(() => 
    safeStreaks.find(s => s.streak_type === "daily_all")?.longest_streak || currentStreak,
    [safeStreaks, currentStreak]
  );
  const completedGoals = useMemo(() => 
    safeGoals.filter(g => g?.status === "completed").length,
    [safeGoals]
  );
  const activeGoals = useMemo(() => 
    safeGoals.filter(g => g?.status === "active").length,
    [safeGoals]
  );
  const totalBadges = useMemo(() => safeBadges.length, [safeBadges]);

  // Мемоизация фильтрации для производительности
  const filteredGoals = useMemo(() => {
    return safeGoals.filter((goal) => {
      if (!goal || !goal.title) return false;
      const matchesSearch = 
        goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = 
        filter === "all" ||
        (filter === "active" && goal.status === "active") ||
        (filter === "completed" && goal.status === "completed");
      
      return matchesSearch && matchesFilter;
    });
  }, [safeGoals, searchQuery, filter]);

  const handleGoalClick = useCallback((goal: Goal) => {
    if (goal.category === "zikr" || goal.category === "quran" || goal.linked_counter_type) {
      // Оптимизация: используем requestAnimationFrame для плавного перехода
      requestAnimationFrame(() => {
        navigate(`/tasbih?goal=${goal.id}`);
      });
    } else {
      setSelectedGoal(goal);
      setGoalDetailOpen(true);
    }
  }, [navigate]);

  const handleQuickAdd = async (goal: Goal) => {
    try {
      await spiritualPathAPI.addProgress(goal.id, 1);
      
      const newValue = (goal.current_value || 0) + 1;
      const isCompleted = newValue >= (goal.target_value || 0);
      const newStatus = isCompleted ? "completed" : goal.status;
      
      if (isCompleted && goal.status !== "completed") {
        try {
          await spiritualPathAPI.updateGoal(goal.id, { 
            status: "completed",
            current_value: newValue 
          });
        } catch (e) {
          console.log("Could not update goal status:", e);
        }
      }
      
      setGoals(goals.map(g => 
        g.id === goal.id 
          ? { ...g, current_value: newValue, status: newStatus }
          : g
      ));
      
      // Синхронизация с другими страницами
      window.dispatchEvent(new CustomEvent('goalsUpdated'));

      if (isCompleted && goal.status !== "completed") {
        toast({
          title: "🎉 Цель достигнута!",
          description: "Ма ша Аллах! Цель перемещена в 'Выполненные'",
        });
      } else {
        toast({
          title: `+1 к "${goal.title}"`,
          description: `${newValue}/${goal.target_value}`,
        });
      }
    } catch (error) {
      console.error("Error adding progress:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить прогресс",
        variant: "destructive",
      });
    }
  };

  const handleAddProgress = async (amount: number) => {
    if (!selectedGoal) return;
    
    try {
      await spiritualPathAPI.addProgress(selectedGoal.id, amount);
      
      const newValue = Math.max(0, (selectedGoal.current_value || 0) + amount);
      const isCompleted = newValue >= (selectedGoal.target_value || 0);
      const newStatus = isCompleted ? "completed" : selectedGoal.status;
      
      if (isCompleted && selectedGoal.status !== "completed") {
        try {
          await spiritualPathAPI.updateGoal(selectedGoal.id, { 
            status: "completed",
            current_value: newValue 
          });
        } catch (e) {
          console.log("Could not update goal status:", e);
        }
      }
      
      setSelectedGoal({ ...selectedGoal, current_value: newValue, status: newStatus });
      
      setGoals(goals.map(g => 
        g.id === selectedGoal.id 
          ? { ...g, current_value: newValue, status: newStatus }
          : g
      ));
      
      // Синхронизация с другими страницами
      window.dispatchEvent(new CustomEvent('goalsUpdated'));

      if (isCompleted && selectedGoal.status !== "completed" && amount > 0) {
        toast({
          title: "🎉 Цель достигнута!",
          description: "Ма ша Аллах! Поздравляем!",
        });
        setTimeout(() => setGoalDetailOpen(false), 1500);
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить прогресс",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGoal = async () => {
    if (!selectedGoal) return;
    
    try {
      await spiritualPathAPI.deleteGoal(selectedGoal.id);
      setGoals(goals.filter(g => g.id !== selectedGoal.id));
      setGoalDetailOpen(false);
      setSelectedGoal(null);
      
      // Синхронизация с другими страницами
      window.dispatchEvent(new CustomEvent('goalsUpdated'));
      toast({
        title: "Цель удалена",
        description: "Цель успешно удалена",
      });
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить цель",
        variant: "destructive",
      });
    }
  };

  // Показываем loading только если нет данных в кэше
  const hasCachedData = goals.length > 0 || streaks.length > 0 || badges.length > 0;
  
  if (loading && !hasCachedData) {
    return (
      <div className="min-h-screen bg-background pb-20 sm:pb-28">
        <MainHeader />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
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

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-lg min-h-[calc(100vh-120px)]">
        {/* Header - упрощённый */}
        <div className="flex items-center justify-between mb-4 sm:mb-5 gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Цели</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
              {activeGoals > 0 ? `${activeGoals} активных` : "Создайте первую цель"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="sm"
              className="rounded-xl text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Добавить</span>
            </Button>
            <button
              onClick={() => navigate("/statistics")}
              className="p-2 sm:p-2.5 rounded-xl bg-card hover:bg-secondary transition-colors border border-border/50 flex-shrink-0"
              aria-label="Статистика"
            >
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Блок пропущенные намазы */}
        <Card className="mb-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20 rounded-xl">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0">
                  <CircleDot className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">Пропущенные намазы</h3>
                  <p className="text-xs text-muted-foreground">Рассчитайте и восполните</p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/spiritual-path?tab=qaza")}
                variant="outline"
                size="sm"
                className="rounded-xl flex-shrink-0 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Посчитать</span>
                <span className="sm:hidden">→</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Горизонтальный календарь - упрощённый */}
        <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4 no-scrollbar scrollbar-hide">
          {weekDays.map((day) => {
            const isSelected = day.date.toDateString() === selectedDate.toDateString();
            const isToday = day.isToday;
            return (
              <button
                key={day.dayNum}
                onClick={() => setSelectedDate(day.date)}
                className={cn(
                  "flex flex-col items-center min-w-[44px] sm:min-w-[52px] py-2 px-2 sm:px-3 rounded-xl transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                    : isToday
                    ? "bg-primary/20 text-foreground border border-primary/30"
                    : "bg-card/50 text-muted-foreground border border-border/30 hover:border-primary/20 hover:bg-card"
                )}
              >
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1",
                  isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {day.dayName}
                </span>
                <span className={cn(
                  "text-base sm:text-lg font-bold",
                  isSelected ? "text-primary-foreground" : "text-foreground"
                )}>
                  {day.dayNum}
                </span>
              </button>
            );
          })}
        </div>

        {/* Компактная статистика - объединённая */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-6 border border-primary/20 slide-up">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* Streak */}
            <button 
              onClick={() => navigate("/statistics")}
              className="bg-card/80 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-4 text-center hover:bg-card transition-all border border-border/30"
            >
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <Flame className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground mb-0.5">{currentStreak}</p>
              <p className="text-[9px] sm:text-xs text-muted-foreground">Дней</p>
            </button>
            
            {/* Активные */}
            <div className="bg-card/80 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-4 text-center border border-border/30">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <Target className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground mb-0.5">{activeGoals}</p>
              <p className="text-[9px] sm:text-xs text-muted-foreground">Активных</p>
            </div>
            
            {/* Выполнено */}
            <button 
              onClick={() => navigate("/statistics")}
              className="bg-card/80 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-4 text-center hover:bg-card transition-all border border-border/30"
            >
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-1 sm:mb-2">
                <Check className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-foreground mb-0.5">{completedGoals}</p>
              <p className="text-[9px] sm:text-xs text-muted-foreground">Готово</p>
            </button>
          </div>
          
          {/* Мотивационное сообщение */}
          {currentStreak > 0 && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/30 text-center">
              <p className="text-sm text-primary font-medium">
                🔥 {currentStreak} {currentStreak === 1 ? "день" : currentStreak < 5 ? "дня" : "дней"} подряд! Продолжайте!
              </p>
            </div>
          )}
        </div>

        {/* Goals by Category - компактный список по категориям */}
        <div className="space-y-3 sm:space-y-4">
          <GoalsByCategory />
        </div>
      </main>

      {/* FAB с анимациями */}
      <CreateGoalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onGoalCreated={loadData}
      >
        <button className="fixed bottom-28 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center z-40 breathing-glow magnetic">
          <Plus className="w-7 h-7 wiggle-hover" strokeWidth={2.5} />
        </button>
      </CreateGoalDialog>

      {/* Smart Templates Sheet */}
      <Sheet open={templatesOpen} onOpenChange={setTemplatesOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl bg-card border-border/50">
          <SheetHeader>
            <SheetTitle className="text-foreground">Умные предложения</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100%-60px)] mt-4">
            <SmartGoalTemplates onTemplateSelected={() => {
              setTemplatesOpen(false);
              loadData();
            }} />
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Goal Detail Sheet */}
      <Sheet open={goalDetailOpen} onOpenChange={setGoalDetailOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl bg-card border-border/50">
          <SheetHeader>
            <SheetTitle className="text-foreground">{selectedGoal?.title}</SheetTitle>
          </SheetHeader>
          
          {selectedGoal && (
            <div className="mt-6 space-y-6">
              {/* Прогресс */}
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 relative">
                  <svg className="w-32 h-32 -rotate-90 absolute">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="hsl(var(--secondary))"
                      strokeWidth="12"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="hsl(var(--primary))"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${Math.min(((selectedGoal.current_value || 0) / (selectedGoal.target_value || 1)) * 351.86, 351.86)} 351.86`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{selectedGoal.current_value || 0}</p>
                    <p className="text-sm text-muted-foreground">из {selectedGoal.target_value || 0}</p>
                  </div>
                </div>

                {selectedGoal.description && (
                  <p className="text-sm text-muted-foreground mb-4">{selectedGoal.description}</p>
                )}
              </div>

              {/* Кнопки управления */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-14 h-14 border-border/50"
                  onClick={() => handleAddProgress(-1)}
                  disabled={(selectedGoal.current_value || 0) <= 0}
                >
                  <Minus className="w-6 h-6" />
                </Button>

                <Button
                  size="lg"
                  className="rounded-full w-20 h-20 bg-primary hover:bg-primary/90 text-primary-foreground text-2xl font-bold"
                  onClick={() => handleAddProgress(1)}
                >
                  +1
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-14 h-14 border-border/50"
                  onClick={() => handleAddProgress(5)}
                >
                  +5
                </Button>
              </div>

              {/* Действия */}
              <div className="flex gap-3 pt-4">
                {(selectedGoal.category === "zikr" || selectedGoal.category === "quran") && (
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-border/50"
                    onClick={() => {
                      setGoalDetailOpen(false);
                      navigate(`/tasbih?goal=${selectedGoal.id}`);
                    }}
                  >
                    Открыть в Тасбих
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 border-border/50"
                  onClick={handleDeleteGoal}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
};

export default Goals;
