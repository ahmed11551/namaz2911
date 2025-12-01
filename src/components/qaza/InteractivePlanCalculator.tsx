// Интерактивный планировщик с возможностью изменения цели

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, TrendingDown, Clock, Target, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import type { DebtSnapshot } from "@/types/prayer-debt";

interface InteractivePlanCalculatorProps {
  snapshot: DebtSnapshot | null;
  currentPace: number; // текущий темп (намазов в день)
  currentEstimatedCompletion: { months: number; days: number };
}

export const InteractivePlanCalculator = ({
  snapshot,
  currentPace,
  currentEstimatedCompletion,
}: InteractivePlanCalculatorProps) => {
  const [customDailyGoal, setCustomDailyGoal] = useState<number>(currentPace || 10);

  // Расчет оставшихся намазов
  const totalRemaining = useMemo(() => {
    if (!snapshot) return 0;
    const remainingFromMissed = Object.values(snapshot.remaining_prayers || {}).reduce(
      (sum, val) => sum + Math.max(0, val || 0),
      0
    );
    const travelPrayers = Object.values(snapshot.debt_calculation.travel_prayers || {}).reduce(
      (sum, val) => sum + Math.max(0, val || 0),
      0
    );
    return remainingFromMissed + travelPrayers;
  }, [snapshot]);

  // Расчет времени завершения для кастомной цели
  const customEstimatedCompletion = useMemo(() => {
    if (customDailyGoal <= 0 || totalRemaining <= 0) {
      return { months: 0, days: 0, totalDays: 0 };
    }

    const totalDays = Math.ceil(totalRemaining / customDailyGoal);
    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;

    return { months, days, totalDays };
  }, [customDailyGoal, totalRemaining]);

  // Расчет текущего времени завершения
  const currentTotalDays = useMemo(() => {
    if (currentPace <= 0 || totalRemaining <= 0) return 0;
    return Math.ceil(totalRemaining / currentPace);
  }, [currentPace, totalRemaining]);

  // Разница в днях
  const daysDifference = useMemo(() => {
    return currentTotalDays - customEstimatedCompletion.totalDays;
  }, [currentTotalDays, customEstimatedCompletion.totalDays]);

  // Процент улучшения
  const improvementPercent = useMemo(() => {
    if (currentTotalDays === 0) return 0;
    return Math.round((daysDifference / currentTotalDays) * 100);
  }, [daysDifference, currentTotalDays]);

  // Быстрые варианты целей
  const quickGoals = [5, 10, 15, 20, 25, 30];

  const handleQuickGoal = (goal: number) => {
    setCustomDailyGoal(goal);
  };

  if (!snapshot || totalRemaining === 0) {
    return (
      <Card className="bg-gradient-card border-border/50">
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 text-primary/50" />
            <p>Нет данных для планирования</p>
            <p className="text-sm mt-2">Сначала рассчитайте пропущенные намазы</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Текущий план */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <CardTitle>Текущий план</CardTitle>
          </div>
          <CardDescription>
            Основан на вашем текущем темпе восполнения
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div>
                <div className="text-sm text-muted-foreground">Текущий темп</div>
                <div className="text-2xl font-bold text-primary">{currentPace} намазов/день</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Время до завершения</div>
                <div className="text-2xl font-bold">
                  {currentEstimatedCompletion.months > 0 && `${currentEstimatedCompletion.months} мес. `}
                  {currentEstimatedCompletion.days > 0 && `${currentEstimatedCompletion.days} дн.`}
                  {currentEstimatedCompletion.months === 0 && currentEstimatedCompletion.days === 0 && "0 дн."}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  ({currentTotalDays} дней)
                </div>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Осталось восполнить: <strong className="text-foreground">{totalRemaining.toLocaleString("ru-RU")}</strong> намазов
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Интерактивный калькулятор */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            <CardTitle>Планирование новой цели</CardTitle>
          </div>
          <CardDescription>
            Измените количество намазов в день и посмотрите, как изменится время завершения
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Быстрый выбор */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Быстрый выбор цели</Label>
            <div className="flex flex-wrap gap-2">
              {quickGoals.map((goal) => (
                <Button
                  key={goal}
                  variant={customDailyGoal === goal ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickGoal(goal)}
                  className={customDailyGoal === goal ? "bg-primary" : ""}
                >
                  {goal} намазов/день
                </Button>
              ))}
            </div>
          </div>

          {/* Слайдер */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="daily-goal" className="text-sm font-medium">
                Намазов в день
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="daily-goal"
                  type="number"
                  min={1}
                  max={100}
                  value={customDailyGoal}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setCustomDailyGoal(Math.max(1, Math.min(100, value)));
                  }}
                  className="w-20 text-center"
                />
                <span className="text-sm text-muted-foreground">намазов/день</span>
              </div>
            </div>
            <Slider
              value={[customDailyGoal]}
              onValueChange={([value]) => setCustomDailyGoal(value)}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          {/* Результат */}
          <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">При цели</div>
                  <div className="text-2xl font-bold text-primary">
                    {customDailyGoal} намазов/день
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Время до завершения</div>
                  <div className="text-2xl font-bold">
                    {customEstimatedCompletion.months > 0 && `${customEstimatedCompletion.months} мес. `}
                    {customEstimatedCompletion.days > 0 && `${customEstimatedCompletion.days} дн.`}
                    {customEstimatedCompletion.months === 0 && customEstimatedCompletion.days === 0 && "0 дн."}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    ({customEstimatedCompletion.totalDays} дней)
                  </div>
                </div>
              </div>

              {/* Сравнение */}
              {customDailyGoal !== currentPace && (
                <div className="pt-4 border-t border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    {daysDifference > 0 ? (
                      <>
                        <TrendingDown className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          Вы сэкономите {daysDifference} {daysDifference === 1 ? "день" : daysDifference < 5 ? "дня" : "дней"}
                        </span>
                      </>
                    ) : daysDifference < 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-600">
                          Потребуется на {Math.abs(daysDifference)} {Math.abs(daysDifference) === 1 ? "день" : Math.abs(daysDifference) < 5 ? "дня" : "дней"} больше
                        </span>
                      </>
                    ) : null}
                  </div>
                  {improvementPercent > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Это на <strong className="text-foreground">{improvementPercent}%</strong> быстрее, чем текущий план
                    </div>
                  )}
                  {improvementPercent < 0 && (
                    <div className="text-xs text-muted-foreground">
                      Это на <strong className="text-foreground">{Math.abs(improvementPercent)}%</strong> медленнее, чем текущий план
                    </div>
                  )}
                </div>
              )}

              {/* Еженедельная цель */}
              <div className="pt-4 border-t border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Еженедельная цель</span>
                  <Badge variant="secondary" className="text-base px-3 py-1">
                    {customDailyGoal * 7} намазов/неделю
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Информационное сообщение */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Важно:</strong> Это планирование основано на математических расчетах. 
              Реальное время может отличаться в зависимости от вашей регулярности и обстоятельств.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Рекомендации на основе новой цели */}
      {customDailyGoal !== currentPace && customDailyGoal > 0 && (
        <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <CardTitle>Рекомендации для достижения цели</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customDailyGoal <= 10 && (
                <div className="p-3 rounded-lg bg-background/50">
                  <div className="font-medium mb-1">Умеренный темп</div>
                  <div className="text-sm text-muted-foreground">
                    Рекомендуем распределить намазы равномерно в течение дня: 
                    после каждого обязательного намаза по 1-2 каза.
                  </div>
                </div>
              )}
              {customDailyGoal > 10 && customDailyGoal <= 20 && (
                <div className="p-3 rounded-lg bg-background/50">
                  <div className="font-medium mb-1">Активный темп</div>
                  <div className="text-sm text-muted-foreground">
                    Рекомендуем: после Фаджра (+2), после Зухра (+1), после Асра (+2), 
                    после Магриба (+1), после Иша (+1), в выходные (+5-10).
                  </div>
                </div>
              )}
              {customDailyGoal > 20 && (
                <div className="p-3 rounded-lg bg-background/50">
                  <div className="font-medium mb-1">Интенсивный темп</div>
                  <div className="text-sm text-muted-foreground">
                    Рекомендуем: после каждого обязательного намаза по 2-3 каза, 
                    в выходные дни по 10-15 каза. Важно не переутомляться и сохранять качество намаза.
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

