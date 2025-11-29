// Умные шаблоны целей - AI-предложения на основе анализа поведения

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Target, Zap, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import { useUserData } from "@/hooks/useUserData";
import type { Goal, GoalCategory, GoalPeriod } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";

interface SmartTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  target_value: number;
  period: string;
  reason: string;
  priority: "high" | "medium" | "low";
  suggested_daily_plan?: number;
}

export const SmartGoalTemplates = ({ onTemplateSelected }: { onTemplateSelected?: () => void }) => {
  const { toast } = useToast();
  const { userData } = useUserData();
  const [templates, setTemplates] = useState<SmartTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateTemplates();
  }, [userData]);

  const generateTemplates = async () => {
    setLoading(true);
    try {
      // Анализ данных пользователя для генерации предложений
      const suggestions = await analyzeUserBehavior();

      setTemplates(suggestions);
    } catch (error) {
      console.error("Error generating templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeUserBehavior = async (): Promise<SmartTemplate[]> => {
    const suggestions: SmartTemplate[] = [];

    try {
      // Получаем существующие цели (активные и завершенные)
      const existingGoals = await spiritualPathAPI.getGoals("active");
      const completedGoals = await spiritualPathAPI.getGoals("completed");
      
      // Анализ прогресса по каза намазам
      if (userData?.repayment_progress?.completed_prayers) {
        const totalCompleted = Object.values(
          userData.repayment_progress.completed_prayers
        ).reduce((sum, val) => sum + (val || 0), 0);

        const totalRemaining = 
          Object.values(userData.debt_calculation?.missed_prayers || {}).reduce((sum, val) => sum + val, 0) +
          Object.values(userData.debt_calculation?.travel_prayers || {}).reduce((sum, val) => sum + val, 0);

        if (totalRemaining > 0) {
          const progressPercent = totalRemaining > 0 
            ? Math.round((totalCompleted / (totalCompleted + totalRemaining)) * 100) 
            : 0;

          if (progressPercent < 50) {
            // Предложение по каза намазам
            const monthlyTarget = Math.max(30, Math.ceil(totalRemaining * 0.1));
            suggestions.push({
              id: "qaza_monthly",
              title: `Восполнить ${monthlyTarget} намазов за месяц`,
              description: "Я вижу, у вас есть пропущенные намазы. Давайте начнем с малого — восполним часть за месяц.",
              category: "prayer",
              target_value: monthlyTarget,
              period: "month",
              reason: `Вы восполнили ${totalCompleted} из ${totalCompleted + totalRemaining} намазов. Начните с ${monthlyTarget} намазов в месяц.`,
              priority: "high",
              suggested_daily_plan: Math.ceil(monthlyTarget / 30),
            });
          }
        }
      }

      // Анализ существующих целей
      const quranGoals = existingGoals.filter(g => g.category === "quran");
      const zikrGoals = existingGoals.filter(g => g.category === "zikr");
      const prayerGoals = existingGoals.filter(g => g.category === "prayer");

      // Предложение по Корану
      if (quranGoals.length === 0) {
        suggestions.push({
          id: "quran_daily",
          title: "Читать 1 страницу Корана в день",
          description: "Я вижу, у вас нет целей по Корану. Хотите поставить цель читать Коран ежедневно?",
          category: "quran",
          target_value: 604, // Примерно 604 страницы в Коране
          period: "year",
          reason: "Стабильная ежедневная практика поможет вам прочитать весь Коран за год.",
          priority: "medium",
          suggested_daily_plan: 1,
        });
      } else {
        // Если есть цели по Корану, анализируем прогресс
        const activeQuranGoal = quranGoals.find(g => g.status === "active");
        if (activeQuranGoal) {
          const progress = (activeQuranGoal.current_value / activeQuranGoal.target_value) * 100;
          if (progress < 30) {
            suggestions.push({
              id: "quran_boost",
              title: "Увеличить ежедневное чтение Корана",
              description: "Ваш прогресс по Корану ниже 30%. Предлагаю увеличить ежедневный план.",
              category: "quran",
              target_value: activeQuranGoal.target_value,
              period: activeQuranGoal.period,
              reason: `Текущий прогресс: ${Math.round(progress)}%. Увеличьте ежедневный план для достижения цели.`,
              priority: "medium",
            });
          }
        }
      }

      // Предложение по зикрам
      if (zikrGoals.length === 0) {
        suggestions.push({
          id: "zikr_daily",
          title: "Ежедневные утренние и вечерние азкары",
          description: "Регулярные поминания Аллаха — основа духовного роста.",
          category: "zikr",
          target_value: 99,
          period: "infinite",
          reason: "Ежедневная практика поминаний укрепит вашу связь с Аллахом.",
          priority: "high",
        });
      }

      // Предложение по садаке
      const sadaqaGoals = existingGoals.filter(g => g.category === "sadaqa");
      if (sadaqaGoals.length === 0) {
        suggestions.push({
          id: "sadaqa_monthly",
          title: "Регулярная садака — 4 раза в месяц",
          description: "Давайте сделаем садаку регулярной практикой.",
          category: "sadaqa",
          target_value: 4,
          period: "month",
          reason: "Регулярная садака — это проявление благодарности и милосердия.",
          priority: "low",
        });
      }

      // Предложение по ночным намазам (если есть пропуски)
      if (prayerGoals.length === 0 && userData?.repayment_progress) {
        const ishaCount = userData.repayment_progress.completed_prayers?.isha || 0;
        const fajrCount = userData.repayment_progress.completed_prayers?.fajr || 0;
        
        // Если мало ночных намазов, предлагаем тахаджуд
        if (ishaCount < 10 || fajrCount < 10) {
          suggestions.push({
            id: "tahajjud_weekly",
            title: "Тахаджуд 2 раза в неделю",
            description: "Ночные намазы — особое время для дуа и близости к Аллаху.",
            category: "prayer",
            target_value: 2,
            period: "week",
            reason: "Начните с малого — 2 раза в неделю. Это поможет укрепить связь с Аллахом.",
            priority: "medium",
          });
        }
      }

      // Анализ завершенных целей для понимания успешных паттернов
      if (completedGoals.length > 0) {
        // Находим наиболее успешные категории
        const categorySuccess = completedGoals.reduce((acc: Record<string, number>, goal) => {
          acc[goal.category] = (acc[goal.category] || 0) + 1;
          return acc;
        }, {});

        // Предлагаем продолжить успешные практики
        const mostSuccessfulCategory = Object.entries(categorySuccess)
          .sort(([, a], [, b]) => (b as number) - (a as number))[0];

        if (mostSuccessfulCategory && !existingGoals.some(g => g.category === mostSuccessfulCategory[0])) {
          const [category, count] = mostSuccessfulCategory;
          const categoryLabels: Record<string, string> = {
            prayer: "намазов",
            quran: "страниц Корана",
            zikr: "зикров",
            sadaqa: "раз садаки",
            knowledge: "уроков",
            names_of_allah: "имен Аллаха",
          };

          suggestions.push({
            id: `continue_${category}`,
            title: `Продолжить практику ${categoryLabels[category] || category}`,
            description: `Вы успешно завершили ${count} ${count === 1 ? "цель" : "целей"} в этой категории. Продолжайте в том же духе!`,
            category: category,
            target_value: category === "quran" ? 604 : category === "prayer" ? 30 : 99,
            period: category === "quran" ? "year" : category === "prayer" ? "month" : "infinite",
            reason: `Ваш успех в этой категории показывает, что вы на правильном пути. Продолжайте развиваться!`,
            priority: "high",
            suggested_daily_plan: category === "quran" ? 1 : category === "prayer" ? 1 : undefined,
          });
        }
      }

      // Анализ активности: если пользователь стабильно читает Коран
      const recentQuranGoals = completedGoals
        .filter(g => g.category === "quran")
        .sort((a, b) => {
          const dateA = new Date(a.updated_at || a.created_at).getTime();
          const dateB = new Date(b.updated_at || b.created_at).getTime();
          return dateB - dateA;
        })
        .slice(0, 3);

      if (recentQuranGoals.length > 0 && quranGoals.length === 0) {
        // Вычисляем средний темп чтения
        const avgPagesPerDay = recentQuranGoals.reduce((sum, goal) => {
          const days = goal.end_date && goal.start_date
            ? Math.ceil((new Date(goal.end_date).getTime() - new Date(goal.start_date).getTime()) / (1000 * 60 * 60 * 24))
            : 30;
          return sum + (goal.target_value / days);
        }, 0) / recentQuranGoals.length;

        if (avgPagesPerDay > 0 && avgPagesPerDay < 2) {
          suggestions.push({
            id: "quran_consistent",
            title: `Читать ${Math.round(avgPagesPerDay * 10) / 10} страниц Корана в день`,
            description: `Я вижу, вы стабильно читаете примерно ${Math.round(avgPagesPerDay * 10) / 10} страницы в день. Хотите поставить цель прочитать весь Коран за ${Math.ceil(604 / avgPagesPerDay)} дней?`,
            category: "quran",
            target_value: 604,
            period: "year",
            reason: `На основе вашей истории, вы читаете примерно ${Math.round(avgPagesPerDay * 10) / 10} страниц в день. Это отличный темп для завершения Корана за год!`,
            priority: "high",
            suggested_daily_plan: Math.ceil(avgPagesPerDay),
          });
        }
      }

      // Предложение на основе слабых сторон
      const allCategories = ["prayer", "quran", "zikr", "sadaqa", "knowledge", "names_of_allah"];
      const categoriesWithGoals = new Set([...existingGoals, ...completedGoals].map(g => g.category));
      const missingCategories = allCategories.filter(cat => !categoriesWithGoals.has(cat));

      if (missingCategories.length > 0) {
        // Предлагаем начать с наиболее важных категорий
        const priorityOrder = ["prayer", "zikr", "quran", "sadaqa", "knowledge", "names_of_allah"];
        const nextCategory = priorityOrder.find(cat => missingCategories.includes(cat));

        if (nextCategory) {
          const categoryData: Record<string, { title: string; value: number; period: string; plan?: number }> = {
            prayer: { title: "30 намазов за месяц", value: 30, period: "month", plan: 1 },
            zikr: { title: "Ежедневные азкары", value: 99, period: "infinite" },
            quran: { title: "1 страница Корана в день", value: 604, period: "year", plan: 1 },
            sadaqa: { title: "Садака 4 раза в месяц", value: 4, period: "month" },
            knowledge: { title: "Изучать знания", value: 30, period: "month", plan: 1 },
            names_of_allah: { title: "Выучить 99 имен Аллаха", value: 99, period: "infinite" },
          };

          const data = categoryData[nextCategory];
          if (data) {
            suggestions.push({
              id: `start_${nextCategory}`,
              title: data.title,
              description: `Расширьте свой духовный путь, добавив практику в категории "${getCategoryLabel(nextCategory)}".`,
              category: nextCategory,
              target_value: data.value,
              period: data.period,
              reason: `Добавление разнообразия в ваши духовные практики поможет всестороннему росту.`,
              priority: "medium",
              suggested_daily_plan: data.plan,
            });
          }
        }
      }

    } catch (error) {
      console.error("Error analyzing user behavior:", error);
    }

    return suggestions;
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      prayer: "Намаз",
      quran: "Коран",
      zikr: "Зикр",
      sadaqa: "Садака",
      knowledge: "Знания",
      names_of_allah: "99 имен Аллаха",
    };
    return labels[category] || category;
  };

  const handleApplyTemplate = async (template: SmartTemplate) => {
    try {
      // Создаем цель на основе шаблона
      const startDate = new Date();
      let endDate: Date | undefined = undefined;

      // Расчет даты окончания
      if (template.period === "month") {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (template.period === "week") {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
      } else if (template.period === "year") {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      await spiritualPathAPI.createGoal({
        title: template.title,
        description: template.description,
        category: template.category as GoalCategory,
        type: template.period === "infinite" ? "habit" : "fixed_term",
        period: template.period as GoalPeriod,
        metric: "count",
        target_value: template.target_value,
        current_value: 0,
        start_date: startDate,
        end_date: endDate,
        status: "active",
        daily_plan: template.suggested_daily_plan,
      });

      toast({
        title: "Цель создана!",
        description: `"${template.title}" добавлена в ваш путь`,
      });

      onTemplateSelected?.();
    } catch (error) {
      console.error("Error applying template:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать цель из шаблона",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Sparkles className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <p>Анализирую ваши данные...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Нет предложений на данный момент</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Умные предложения</h3>
        <Badge variant="outline" className="ml-auto">
          AI
        </Badge>
      </div>

      {templates.map((template) => (
        <Card
          key={template.id}
          className={cn(
            "bg-gradient-card border-border/50 transition-all hover:shadow-md",
            template.priority === "high" && "border-primary/30"
          )}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base mb-1">{template.title}</CardTitle>
                <CardDescription className="text-sm">{template.description}</CardDescription>
              </div>
              {template.priority === "high" && (
                <Badge variant="default" className="ml-2">
                  <Zap className="w-3 h-3 mr-1" />
                  Важно
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-sm text-muted-foreground mb-1">💡 Почему это важно:</p>
              <p className="text-sm">{template.reason}</p>
            </div>

            {template.suggested_daily_plan && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>
                  Рекомендуемый план: <strong>{template.suggested_daily_plan}</strong>{" "}
                  {template.category === "quran" ? "страниц" : template.category === "prayer" ? "намазов" : "раз"} в день
                </span>
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => handleApplyTemplate(template)}
            >
              <Target className="w-4 h-4 mr-2" />
              Добавить в мой путь
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

