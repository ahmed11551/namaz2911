// Страница Цели - дизайн в стиле Qaza Tracker (простой, чистый, минималистичный)

import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Plus,
  Target,
  CheckCircle2,
  Circle,
  Flame,
  TrendingUp,
  BarChart3,
  Calendar,
  Clock,
  Trash2,
  Edit,
  Play,
  Pause,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal, Streak, Badge } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { CreateGoalDialog } from "@/components/spiritual-path/CreateGoalDialog";
import { GoalsByCategory } from "@/components/spiritual-path/GoalsByCategory";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

// Простая карточка цели в стиле Qaza Tracker
const GoalCard = memo(({ 
  goal, 
  onClick,
  onQuickAdd,
}: { 
  goal: Goal; 
  onClick: () => void;
  onQuickAdd?: () => void;
}) => {
  if (!goal || !goal.title) {
    return null;
  }
  
  const currentValue = goal.current_value || 0;
  const targetValue = goal.target_value || 0;
  const progress = targetValue > 0 
    ? Math.min((currentValue / targetValue) * 100, 100)
    : 0;
  const isComplete = currentValue >= targetValue;
  
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "prayer": return "text-green-600 bg-green-50 border-green-200";
      case "quran": return "text-blue-600 bg-blue-50 border-blue-200";
      case "zikr": return "text-purple-600 bg-purple-50 border-purple-200";
      case "sadaqa": return "text-orange-600 bg-orange-50 border-orange-200";
      case "knowledge": return "text-indigo-600 bg-indigo-50 border-indigo-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "prayer": return "🕌";
      case "quran": return "📖";
      case "zikr": return "📿";
      case "sadaqa": return "💰";
      case "knowledge": return "📚";
      default: return "⭐";
    }
  };
  
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickAdd && !isComplete) {
      onQuickAdd();
    }
  };
  
  return (
    <Card
      onClick={onClick}
      className={cn(
        "w-full cursor-pointer transition-all duration-200 hover:shadow-md",
        "border-2",
        isComplete ? "border-green-300 bg-green-50/50" : getCategoryColor(goal.category)
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Иконка категории */}
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0",
              isComplete ? "bg-green-100" : "bg-white"
            )}>
              {getCategoryIcon(goal.category)}
            </div>
            
            {/* Контент */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-base text-gray-900 truncate">
                  {goal.title}
                </h3>
                {isComplete && (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
              </div>
              
              {/* Прогресс */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {currentValue} / {targetValue}
                  </span>
                  <span className="font-medium text-gray-900">
                    {Math.round(progress)}%
                  </span>
                </div>
                <Progress 
                  value={progress} 
                  className={cn(
                    "h-2",
                    isComplete ? "bg-green-200" : ""
                  )}
                />
              </div>
            </div>
          </div>

          {/* Кнопка быстрого добавления */}
          {!isComplete && (
            <button
              onClick={handleQuickAdd}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                "bg-white border-2 border-gray-200 hover:border-gray-300",
                "transition-all active:scale-95 flex-shrink-0"
              )}
              title="Добавить +1"
            >
              <Plus className="w-5 h-5 text-gray-700" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [goalDetailOpen, setGoalDetailOpen] = useState(false);
  const loadingRef = useRef(false);

  // Загрузка данных с защитой от ошибок
  const loadData = useCallback(async () => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    
    try {
      // Сначала загружаем из кэша
      const cachedGoals = spiritualPathAPI.getGoalsFromLocalStorage("all");
      if (Array.isArray(cachedGoals)) {
        setGoals(cachedGoals);
        setLoading(false);
      }

      // Затем загружаем свежие данные
      const [goalsData, streaksData, badgesData] = await Promise.allSettled([
        spiritualPathAPI.getGoals("all"),
        spiritualPathAPI.getStreaks(),
        spiritualPathAPI.getBadges(),
      ]);

      if (goalsData.status === "fulfilled" && Array.isArray(goalsData.value)) {
        setGoals(goalsData.value);
      }
      if (streaksData.status === "fulfilled" && Array.isArray(streaksData.value)) {
        setStreaks(streaksData.value);
      }
      if (badgesData.status === "fulfilled" && Array.isArray(badgesData.value)) {
        setBadges(badgesData.value);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      // Используем кэш при ошибке
      try {
        const cachedGoals = spiritualPathAPI.getGoalsFromLocalStorage("all");
        if (Array.isArray(cachedGoals)) {
          setGoals(cachedGoals);
        }
      } catch (e) {
        console.warn("Error loading cached goals:", e);
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Статистика
  const activeGoals = useMemo(() => 
    goals.filter(g => g.status === "active").length,
    [goals]
  );
  
  const completedGoals = useMemo(() => 
    goals.filter(g => g.status === "completed").length,
    [goals]
  );

  const currentStreak = useMemo(() => 
    streaks.find(s => s.streak_type === "daily_all")?.current_streak || 0,
    [streaks]
  );

  // Обработчики
  const handleGoalClick = useCallback((goal: Goal) => {
    setSelectedGoal(goal);
    setGoalDetailOpen(true);
  }, []);

  const handleQuickAdd = useCallback(async (goal: Goal) => {
    try {
      const updated = await spiritualPathAPI.updateGoal(goal.id, {
        current_value: (goal.current_value || 0) + 1,
      });
      setGoals(goals.map(g => g.id === goal.id ? updated : g));
      toast({
        title: "Прогресс обновлен",
        description: `+1 к "${goal.title}"`,
      });
    } catch (error) {
      console.error("Error updating goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить прогресс",
        variant: "destructive",
      });
    }
  }, [goals, toast]);

  const handleDeleteGoal = async () => {
    if (!selectedGoal) return;
    
    try {
      await spiritualPathAPI.deleteGoal(selectedGoal.id);
      setGoals(goals.filter(g => g.id !== selectedGoal.id));
      setGoalDetailOpen(false);
      setSelectedGoal(null);
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

  // Показываем loading только если нет данных
  if (loading && goals.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <MainHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-white border-2 border-gray-200 flex items-center justify-center">
              <Target className="w-6 h-6 text-gray-400 animate-pulse" />
            </div>
            <p className="text-gray-500 text-sm">Загрузка...</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <MainHeader />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Простой заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Цели</h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeGoals > 0 ? `${activeGoals} активных` : "Создайте первую цель"}
            </p>
          </div>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Добавить
          </Button>
        </div>

        {/* Простая статистика */}
        {activeGoals > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="border-2 border-gray-200 bg-white">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {activeGoals}
                </div>
                <div className="text-xs text-gray-500">Активных</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-gray-200 bg-white">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {completedGoals}
                </div>
                <div className="text-xs text-gray-500">Выполнено</div>
              </CardContent>
            </Card>
            <Card className="border-2 border-gray-200 bg-white">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1 flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5" />
                  {currentStreak}
                </div>
                <div className="text-xs text-gray-500">Дней подряд</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Блок пропущенных намазов */}
        <Card className="mb-6 border-2 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center text-2xl">
                  🕌
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Пропущенные намазы</h3>
                  <p className="text-sm text-gray-600">Рассчитайте и восполните</p>
                </div>
              </div>
              <Button
                onClick={() => navigate("/spiritual-path?tab=qaza")}
                variant="outline"
                size="sm"
                className="border-2 border-gray-300 bg-white hover:bg-gray-50"
              >
                Посчитать
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Список целей */}
        {activeGoals > 0 ? (
          <div className="space-y-3">
            {goals
              .filter(g => g.status === "active")
              .map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onClick={() => handleGoalClick(goal)}
                  onQuickAdd={() => handleQuickAdd(goal)}
                />
              ))}
          </div>
        ) : (
          <Card className="border-2 border-gray-200 bg-white">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center mx-auto mb-4 text-4xl">
                ⭐
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Нет активных целей</h3>
              <p className="text-sm text-gray-500 mb-4">
                Создайте первую цель для отслеживания прогресса
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать цель
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Категории целей */}
        <div className="mt-6">
          <GoalsByCategory />
        </div>
      </main>

      {/* Диалог создания цели */}
      <CreateGoalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onGoalCreated={loadData}
      />

      {/* Детали цели */}
      <Sheet open={goalDetailOpen} onOpenChange={setGoalDetailOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl bg-white">
          <SheetHeader>
            <SheetTitle className="text-gray-900">{selectedGoal?.title}</SheetTitle>
          </SheetHeader>
          
          {selectedGoal && (
            <div className="mt-6 space-y-6">
              {/* Прогресс */}
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {selectedGoal.current_value || 0} / {selectedGoal.target_value || 0}
                </div>
                <Progress 
                  value={((selectedGoal.current_value || 0) / (selectedGoal.target_value || 1)) * 100} 
                  className="h-3"
                />
              </div>

              {selectedGoal.description && (
                <p className="text-sm text-gray-600">{selectedGoal.description}</p>
              )}

              {/* Действия */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleQuickAdd(selectedGoal)}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить +1
                </Button>
                <Button
                  onClick={handleDeleteGoal}
                  variant="outline"
                  className="border-2 border-red-200 text-red-600 hover:bg-red-50"
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
