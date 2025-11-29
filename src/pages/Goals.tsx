// Страница Цели и Привычки - дизайн Fintrack (тёмная тема)

import { useState, useEffect, useMemo } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal, Streak, Badge } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { CreateGoalDialog } from "@/components/spiritual-path/CreateGoalDialog";
import { SmartGoalTemplates } from "@/components/spiritual-path/SmartGoalTemplates";
import { useNavigate } from "react-router-dom";
import { AnalyticsWidget } from "@/components/goals/AnalyticsWidget";
import { AIRecommendations } from "@/components/goals/AIRecommendations";

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

// Компонент карточки цели (Fintrack style)
const GoalCard = ({ 
  goal, 
  onClick,
  onQuickAdd,
}: { 
  goal: Goal; 
  onClick: () => void;
  onQuickAdd?: () => void;
}) => {
  const progress = goal.target_value > 0 
    ? (goal.current_value / goal.target_value) * 100 
    : 0;
  const isComplete = goal.current_value >= goal.target_value;
  const colors = getCategoryColors(goal.category);
  
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
        "w-full bg-card rounded-2xl p-4 border border-border/50 cursor-pointer",
        "hover:border-primary/30 transition-all duration-300",
        "flex items-center gap-4 text-left hover-lift ripple",
        isComplete && "ring-1 ring-primary/30 neon-border"
      )}
    >
      {/* Иконка с градиентом */}
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
        `bg-gradient-to-br ${colors.gradient}`
      )}>
        <div className="text-white">
          {getCategoryIcon(goal.category, goal.title)}
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-foreground truncate">
            {goal.title}
          </h3>
          {isComplete && <span className="text-primary">✓</span>}
        </div>
        
        {/* Прогресс бар */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                isComplete ? "bg-primary" : "bg-primary/70"
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className={cn("text-xs font-medium whitespace-nowrap", colors.text)}>
            {goal.current_value}/{goal.target_value}
          </span>
        </div>
      </div>

      {/* Кнопка быстрого добавления */}
      <div className="flex-shrink-0">
        {isComplete ? (
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-5 h-5 text-primary-foreground" />
          </div>
        ) : (
          <button
            onClick={handleQuickAdd}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              "bg-secondary hover:bg-primary hover:text-primary-foreground text-muted-foreground",
              "active:scale-90"
            )}
            title="Добавить +1"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

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
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsData, streaksData, badgesData] = await Promise.all([
        spiritualPathAPI.getGoals("all"),
        spiritualPathAPI.getStreaks(),
        spiritualPathAPI.getBadges(),
      ]);
      setGoals(goalsData);
      setStreaks(streaksData);
      setBadges(badgesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Статистика
  const currentStreak = streaks.find(s => s.streak_type === "daily_all")?.current_streak || 0;
  const longestStreak = streaks.find(s => s.streak_type === "daily_all")?.longest_streak || currentStreak;
  const completedGoals = goals.filter(g => g.status === "completed").length;
  const activeGoals = goals.filter(g => g.status === "active").length;
  const totalBadges = badges.length;

  const filteredGoals = goals.filter((goal) => {
    const matchesSearch = 
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      filter === "all" ||
      (filter === "active" && goal.status === "active") ||
      (filter === "completed" && goal.status === "completed");
    
    return matchesSearch && matchesFilter;
  });

  const handleGoalClick = (goal: Goal) => {
    if (goal.category === "zikr" || goal.category === "quran" || goal.linked_counter_type) {
      navigate(`/tasbih?goal=${goal.id}`);
    } else {
      setSelectedGoal(goal);
      setGoalDetailOpen(true);
    }
  };

  const handleQuickAdd = async (goal: Goal) => {
    try {
      await spiritualPathAPI.addProgress(goal.id, 1);
      
      const newValue = goal.current_value + 1;
      const isCompleted = newValue >= goal.target_value;
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
      
      const newValue = Math.max(0, selectedGoal.current_value + amount);
      const isCompleted = newValue >= selectedGoal.target_value;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <MainHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
              <Sparkles className="w-6 h-6 text-primary" />
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
        {(() => {
          const hour = new Date().getHours();
          let greeting = "Доброе утро";
          let emoji = "🌅";
          if (hour >= 12 && hour < 17) {
            greeting = "Добрый день";
            emoji = "☀️";
          } else if (hour >= 17 && hour < 21) {
            greeting = "Добрый вечер";
            emoji = "🌇";
          } else if (hour >= 21 || hour < 5) {
            greeting = "Доброй ночи";
            emoji = "🌙";
          }
          return (
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-0.5">{greeting} {emoji}</p>
                <h1 className="text-2xl font-bold text-foreground">Ваши цели</h1>
              </div>
              <button
                onClick={() => navigate("/statistics")}
                className="p-2.5 rounded-xl bg-card hover:bg-secondary transition-colors border border-border/50"
              >
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          );
        })()}

        {/* Горизонтальный календарь */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 no-scrollbar">
          {weekDays.map((day) => {
            const isSelected = day.date.toDateString() === selectedDate.toDateString();
            return (
              <button
                key={day.dayNum}
                onClick={() => setSelectedDate(day.date)}
                className={cn(
                  "flex flex-col items-center min-w-[52px] py-2 px-3 rounded-xl transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-card text-muted-foreground border border-border/50 hover:border-primary/30"
                )}
              >
                <span className={cn(
                  "text-xs font-medium mb-1",
                  isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                  {day.dayName}
                </span>
                <span className={cn(
                  "text-lg font-bold",
                  isSelected ? "text-primary-foreground" : "text-foreground"
                )}>
                  {day.dayNum}
                </span>
              </button>
            );
          })}
        </div>

        {/* Виджет статистики - Fintrack style с анимациями */}
        <div className="bg-card rounded-2xl p-5 mb-6 border border-border/50 slide-up stagger-1">
          <div className="flex items-center justify-between">
            {/* Круговые виджеты прогресса */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
                    <circle 
                      cx="32" cy="32" r="28" fill="none" 
                      stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={176} 
                      strokeDashoffset={176 - (176 * Math.min(activeGoals * 15, 100)) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-foreground text-sm font-bold">{Math.min(activeGoals * 15, 100)}%</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs mt-1">Неделя</p>
              </div>
              
              <div className="text-center">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
                    <circle 
                      cx="32" cy="32" r="28" fill="none" 
                      stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={176} 
                      strokeDashoffset={176 - (176 * Math.min(completedGoals * 10 + 30, 100)) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-foreground text-sm font-bold">{Math.min(completedGoals * 10 + 30, 100)}%</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs mt-1">Месяц</p>
              </div>
            </div>

            {/* Streak виджет */}
            <div className="bg-secondary rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
                  <p className="text-xs text-muted-foreground">Текущий</p>
                </div>
              </div>
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-primary font-bold">{longestStreak}</p>
                  <p className="text-[10px] text-muted-foreground">Рекорд</p>
                </div>
                <div>
                  <p className="text-primary font-bold">{completedGoals}</p>
                  <p className="text-[10px] text-muted-foreground">Всего</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Мини-статистика с анимациями */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <button 
            onClick={() => navigate("/statistics")}
            className="bg-card rounded-xl p-3 border border-border/50 text-center hover:border-primary/30 transition-all hover-lift ripple slide-up stagger-2"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-1.5 magnetic heartbeat">
              <Flame className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-bold text-foreground">{currentStreak}</p>
            <p className="text-[9px] text-muted-foreground font-medium">ДНЕЙ</p>
          </button>
          
          <button className="bg-card rounded-xl p-3 border border-border/50 text-center hover:border-primary/30 transition-all hover-lift ripple slide-up stagger-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center mx-auto mb-1.5 magnetic wiggle-hover">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-bold text-foreground">{activeGoals}</p>
            <p className="text-[9px] text-muted-foreground font-medium">АКТИВНЫХ</p>
          </button>
          
          <button className="bg-card rounded-xl p-3 border border-border/50 text-center hover:border-primary/30 transition-all hover-lift ripple slide-up stagger-4">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-1.5 magnetic wiggle-hover">
              <Check className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-bold text-foreground">{completedGoals}</p>
            <p className="text-[9px] text-muted-foreground font-medium">ГОТОВО</p>
          </button>
          
          <button 
            onClick={() => navigate("/statistics")}
            className="bg-card rounded-xl p-3 border border-border/50 text-center hover:border-primary/30 transition-all hover-lift ripple slide-up stagger-5"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center mx-auto mb-1.5 magnetic wiggle-hover">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <p className="text-lg font-bold text-foreground">{totalBadges}</p>
            <p className="text-[9px] text-muted-foreground font-medium">БЕЙДЖЕЙ</p>
          </button>
        </div>

        {/* Daily Summary с анимацией */}
        <div className="bg-card rounded-2xl p-4 border border-border/50 mb-4 slide-up stagger-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Итоги дня</h3>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("ru", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            {activeGoals > 0 ? (
              <>
                <div className="flex items-center justify-between py-2 px-3 bg-primary/10 rounded-xl">
                  <span className="text-sm text-primary">Осталось выполнить</span>
                  <span className="font-bold text-primary">{activeGoals} {activeGoals === 1 ? "цель" : activeGoals < 5 ? "цели" : "целей"}</span>
                </div>
                {completedGoals > 0 && (
                  <div className="flex items-center justify-between py-2 px-3 bg-blue-500/10 rounded-xl">
                    <span className="text-sm text-blue-400">Уже выполнено</span>
                    <span className="font-bold text-blue-400">{completedGoals} ✓</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground text-center pt-1">
                  {currentStreak > 0 
                    ? `🔥 ${currentStreak} дней подряд! Продолжайте!` 
                    : "Начните сегодня свою серию!"}
                </p>
              </>
            ) : (
              <div className="text-center py-3">
                <p className="text-muted-foreground text-sm mb-2">У вас пока нет активных целей</p>
                <button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="text-primary font-medium text-sm hover:underline"
                >
                  + Создать первую цель
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Islamic Life Hack - совет дня */}
        {(() => {
          const tip = getTodayTip();
          const TipIcon = tip.icon;
          return (
            <div className={cn(
              "bg-gradient-to-br rounded-2xl p-4 mb-6 relative overflow-hidden",
              tip.color
            )}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/80 text-xs font-medium uppercase tracking-wider">Совет дня</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <TipIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">{tip.title}</h4>
                    <p className="text-white/90 text-sm leading-relaxed">{tip.description}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Analytics Widget with Week/Month toggle */}
        <AnalyticsWidget 
          goals={goals} 
          streaks={streaks} 
          className="mb-4 animate-fade-in"
        />

        {/* AI Recommendations */}
        <AIRecommendations 
          goals={goals} 
          streaks={streaks} 
          className="mb-4 animate-fade-in"
        />

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Поиск целей..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl bg-card border-border/50 text-base"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "active", label: "Активные" },
            { id: "completed", label: "Выполненные" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                filter === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground border border-border/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          {filteredGoals.length > 0 ? (
            filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onClick={() => handleGoalClick(goal)}
                onQuickAdd={() => handleQuickAdd(goal)}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-primary/50" />
              </div>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Ничего не найдено" : "Нет целей"}
              </p>
              <Button 
                onClick={() => setCreateDialogOpen(true)} 
                className="rounded-xl bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать цель
              </Button>
            </div>
          )}
        </div>

        {/* Smart Templates Button */}
        {filteredGoals.length > 0 && (
          <div className="mt-6 space-y-3">
            <button
              onClick={() => setTemplatesOpen(true)}
              className="w-full bg-card rounded-2xl p-4 border border-border/50 hover:border-primary/30 transition-all flex items-center gap-4 card-hover"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white flex-shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-foreground">Умные предложения</h3>
                <p className="text-sm text-muted-foreground">Готовые шаблоны целей</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        )}
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
                      strokeDasharray={`${Math.min((selectedGoal.current_value / selectedGoal.target_value) * 351.86, 351.86)} 351.86`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{selectedGoal.current_value}</p>
                    <p className="text-sm text-muted-foreground">из {selectedGoal.target_value}</p>
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
                  disabled={selectedGoal.current_value <= 0}
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
