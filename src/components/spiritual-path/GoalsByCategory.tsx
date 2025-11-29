// Компонент для отображения целей по категориям (компактный список)

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Plus, 
  ChevronRight,
  BookOpen,
  CircleDot,
  Sparkles,
  Heart,
  AlertCircle,
  CheckCircle2,
  ArrowUp,
  Trash2,
  Play
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal } from "@/types/spiritual-path";
import { format } from "date-fns";
import { CreateGoalDialog } from "./CreateGoalDialog";
import { GoalCard } from "./GoalCard";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { loadPendingTasbih, removePendingTasbih, type PendingTasbihEntry } from "@/lib/tasbih-storage";

const CATEGORIES = [
  { id: "quran", label: "Коран", icon: BookOpen, color: "text-blue-600" },
  { id: "prayer", label: "Намазы", icon: CircleDot, color: "text-green-600" },
  { id: "zikr", label: "Зикры", icon: Sparkles, color: "text-purple-600" },
  { id: "sadaqa", label: "Садака", icon: Heart, color: "text-pink-600" },
  { id: "names_of_allah", label: "99 имен Аллаха", icon: Target, color: "text-yellow-600" },
];

const MAX_FREE_GOALS = 5;

export const GoalsByCategory = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [pendingTasbih, setPendingTasbih] = useState<PendingTasbihEntry[]>([]);

  useEffect(() => {
    loadGoals();
    loadPendingTasbihEntries();
    
    // Слушаем обновления незавершенных тасбих-сессий
    const handlePendingUpdate = () => {
      loadPendingTasbihEntries();
    };
    window.addEventListener("pendingTasbihUpdated", handlePendingUpdate);
    return () => window.removeEventListener("pendingTasbihUpdated", handlePendingUpdate);
  }, []);

  // Отслеживание прокрутки для показа кнопки "Наверх"
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loadPendingTasbihEntries = () => {
    const entries = loadPendingTasbih();
    setPendingTasbih(entries);
  };

  const handleContinueTasbih = (entry: PendingTasbihEntry) => {
    if (entry.sessionId) {
      navigate(`/tasbih?session=${entry.sessionId}`);
    } else if (entry.id) {
      navigate(`/tasbih?goal=${entry.id}`);
    } else {
      navigate("/tasbih");
    }
  };

  const handleDeletePendingTasbih = (id: string) => {
    removePendingTasbih(id);
    loadPendingTasbihEntries();
    toast({
      title: "Удалено",
      description: "Незавершенная сессия удалена",
    });
  };

  const handleAfterPrayer = () => {
    // Переходим к тасбиху с категорией "after_prayer"
    // SmartTasbihV2 обработает этот параметр и покажет дуа после намаза
    navigate(`/tasbih?category=after_prayer`);
  };

  const loadGoals = async () => {
    setLoading(true);
    try {
      // Таймаут для загрузки (5 секунд)
      const timeoutPromise = new Promise<Goal[]>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), 5000);
      });

      const goalsPromise = spiritualPathAPI.getGoals();
      const allGoals = await Promise.race([goalsPromise, timeoutPromise]);
      setGoals(Array.isArray(allGoals) ? allGoals : []);
    } catch (error) {
      console.error("Error loading goals:", error);
      // Пытаемся загрузить из localStorage при ошибке
      try {
        const cachedGoals = spiritualPathAPI.getGoalsFromLocalStorage("all");
        setGoals(Array.isArray(cachedGoals) ? cachedGoals : []);
      } catch (e) {
        console.warn("Error loading cached goals:", e);
        setGoals([]);
      }
      // Не показываем toast на мобильных, чтобы не раздражать пользователя
      if (window.innerWidth > 640) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить цели. Используются сохраненные данные.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getGoalsByCategory = (categoryId: string) => {
    return goals.filter(g => g.category === categoryId && g.status === "active");
  };

  // Проверка лимита целей с учетом тарифа
  const [canAddMoreGoals, setCanAddMoreGoals] = useState(true);
  
  useEffect(() => {
    const checkGoalLimit = async () => {
      try {
        const { getUserTier } = await import("@/lib/subscription");
        const tier = await getUserTier();
        if (tier === "muslim") {
          const activeGoalsCount = goals.filter(g => g.status === "active").length;
          setCanAddMoreGoals(activeGoalsCount < MAX_FREE_GOALS);
        } else {
          // PRO и Premium - неограниченное количество
          setCanAddMoreGoals(true);
        }
      } catch (error) {
        console.error("Error checking goal limit:", error);
        // При ошибке разрешаем создание (лучше разрешить, чем заблокировать)
        setCanAddMoreGoals(true);
      }
    };
    
    checkGoalLimit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals]);

  const handleCategoryClick = (categoryId: string) => {
    const categoryGoals = getGoalsByCategory(categoryId);
    if (categoryGoals.length === 0) {
      // Если нет целей в категории, открываем диалог создания с предвыбранной категорией
      setCreateDialogOpen(true);
      // TODO: передать категорию в диалог
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
  };

  const handleBack = () => {
    if (selectedGoal) {
      setSelectedGoal(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Загрузка целей...</p>
        </div>
      </div>
    );
  }

  // Если выбранная цель - показываем карточку цели
  if (selectedGoal) {
    return (
      <GoalCard 
        goal={selectedGoal} 
        onBack={handleBack}
        onUpdate={loadGoals}
      />
    );
  }

  // Если выбрана категория - показываем список целей в категории
  if (selectedCategory) {
    const categoryGoals = getGoalsByCategory(selectedCategory);
    const category = CATEGORIES.find(c => c.id === selectedCategory);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Button>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {category && <category.icon className={cn("w-6 h-6", category.color)} />}
            {category?.label}
          </h2>
        </div>

        {categoryGoals.length > 0 ? (
          <div className="space-y-2">
            {categoryGoals.map((goal, index) => (
              <Card 
                key={goal.id} 
                className="cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => handleGoalClick(goal)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">{index + 1}.</span>
                        <h3 className="font-semibold">{goal.title}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {goal.current_value} / {goal.target_value}
                        </span>
                        <Progress 
                          value={(goal.current_value / goal.target_value) * 100} 
                          className="flex-1 h-2"
                        />
                        <span className="text-muted-foreground">
                          {Math.round((goal.current_value / goal.target_value) * 100)}%
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-secondary/50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Нет целей в этой категории
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать цель
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Главный экран - категории
  const activeGoalsCount = goals.filter(g => g.status === "active").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Заголовок и кнопка добавления */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <span className="hidden sm:inline">Цели</span>
        </h2>
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          disabled={!canAddMoreGoals}
          size="sm"
          className="rounded-xl"
        >
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Добавить цель</span>
          <span className="sm:hidden">Добавить</span>
        </Button>
      </div>

      {/* Ограничение для бесплатных пользователей */}
      {!canAddMoreGoals && (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold mb-1">Достигнут лимит бесплатных целей</p>
                <p className="text-sm text-muted-foreground">
                  Перейдите на PRO версию для неограниченного количества целей
                </p>
              </div>
              <Button variant="outline" size="sm">
                Перейти на PRO
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Быстрые действия */}
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAfterPrayer}
          className="flex-1 rounded-xl border-border/50"
        >
          <Play className="w-4 h-4 mr-2" />
          После намаза
        </Button>
      </div>

      {/* Блок незавершенных тасбих-сессий */}
      {pendingTasbih.length > 0 && (
        <Card className="bg-gradient-card border-border/50 mb-4 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Тасбих
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {pendingTasbih.map((entry) => {
              const percent = entry.target
                ? Math.min(100, Math.round((entry.current / entry.target) * 100))
                : 0;
              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-primary/20 bg-background/80 p-3 sm:p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {entry.category || "Зикр"}
                        </Badge>
                        <p className="font-semibold text-sm truncate">{entry.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {entry.current}/{entry.target || "∞"} • обновлено{" "}
                        {new Date(entry.updatedAt).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleContinueTasbih(entry)}
                        className="rounded-lg text-xs sm:text-sm"
                      >
                        <span className="hidden sm:inline">Продолжить</span>
                        <span className="sm:hidden">→</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePendingTasbih(entry.id)}
                        className="rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {entry.target && (
                    <Progress value={percent} className="h-1.5 sm:h-2" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Блок пропущенных намазов */}
      <Card className="bg-gradient-card border-border/50 rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CircleDot className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Пропущенные намазы
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Button 
            variant="outline" 
            className="w-full rounded-xl"
            onClick={() => navigate("/spiritual-path?tab=qaza")}
          >
            Посчитать намазы
          </Button>
        </CardContent>
      </Card>

      {/* Категории целей */}
      <div className="space-y-3 sm:space-y-4">
        {CATEGORIES.map((category) => {
          const categoryGoals = getGoalsByCategory(category.id);
          const totalProgress = categoryGoals.reduce((sum, g) => {
            return sum + (g.current_value / g.target_value) * 100;
          }, 0);
          const avgProgress = categoryGoals.length > 0 ? totalProgress / categoryGoals.length : 0;

          return (
            <Card 
              key={category.id}
              className="cursor-pointer hover:bg-secondary/50 transition-all duration-200 rounded-xl border-border/50 hover:border-primary/30 hover:shadow-md"
              onClick={() => handleCategoryClick(category.id)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn("p-2 sm:p-2.5 rounded-xl bg-primary/10 flex-shrink-0", category.color)}>
                      <category.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", category.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{category.label}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {categoryGoals.length} {categoryGoals.length === 1 ? "цель" : "целей"}
                        {categoryGoals.length > 0 && (
                          <span className="ml-2">
                            • {Math.round(avgProgress)}% выполнено
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Пустое состояние */}
      {goals.length === 0 && (
        <Card className="bg-gradient-card border-border/50 rounded-xl">
          <CardContent className="pt-6">
            <div className="text-center py-6 sm:py-8">
              <Target className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                У вас пока нет целей
              </p>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать первую цель
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateGoalDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onGoalCreated={loadGoals}
      />
    </div>
  );
};

