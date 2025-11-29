// Компонент для отображения целей по категориям (компактный список)

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Plus, 
  ChevronRight,
  BookOpen,
  Prayer,
  Sparkles,
  Heart,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal } from "@/types/spiritual-path";
import { format } from "date-fns";
import { CreateGoalDialog } from "./CreateGoalDialog";
import { GoalCard } from "./GoalCard";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  { id: "quran", label: "Коран", icon: BookOpen, color: "text-blue-600" },
  { id: "prayer", label: "Намазы", icon: Prayer, color: "text-green-600" },
  { id: "zikr", label: "Зикры", icon: Sparkles, color: "text-purple-600" },
  { id: "sadaqa", label: "Садака", icon: Heart, color: "text-pink-600" },
  { id: "names_of_allah", label: "99 имен Аллаха", icon: Target, color: "text-yellow-600" },
];

const MAX_FREE_GOALS = 5;

export const GoalsByCategory = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const allGoals = await spiritualPathAPI.getGoals();
      setGoals(allGoals);
    } catch (error) {
      console.error("Error loading goals:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить цели",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getGoalsByCategory = (categoryId: string) => {
    return goals.filter(g => g.category === categoryId && g.status === "active");
  };

  const canAddMoreGoals = goals.filter(g => g.status === "active").length < MAX_FREE_GOALS;

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
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка целей...</div>
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
    <div className="space-y-6">
      {/* Заголовок и кнопка добавления */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" />
          Цели
        </h2>
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          disabled={!canAddMoreGoals}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить цель
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

      {/* Блок пропущенных намазов */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Prayer className="w-5 h-5 text-primary" />
            Пропущенные намазы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/")}
          >
            Посчитать намазы
          </Button>
        </CardContent>
      </Card>

      {/* Категории целей */}
      <div className="space-y-4">
        {CATEGORIES.map((category) => {
          const categoryGoals = getGoalsByCategory(category.id);
          const totalProgress = categoryGoals.reduce((sum, g) => {
            return sum + (g.current_value / g.target_value) * 100;
          }, 0);
          const avgProgress = categoryGoals.length > 0 ? totalProgress / categoryGoals.length : 0;

          return (
            <Card 
              key={category.id}
              className="cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => handleCategoryClick(category.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn("p-2 rounded-lg bg-primary/10", category.color)}>
                      <category.icon className={cn("w-5 h-5", category.color)} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{category.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {categoryGoals.length} {categoryGoals.length === 1 ? "цель" : "целей"}
                        {categoryGoals.length > 0 && (
                          <span className="ml-2">
                            • {Math.round(avgProgress)}% выполнено
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Пустое состояние */}
      {goals.length === 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                У вас пока нет целей
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
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

