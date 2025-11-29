import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";
import { PrayerProgressCard } from "./PrayerProgressCard";
import { AddPrayerDialog } from "./AddPrayerDialog";
import { useUserData } from "@/hooks/useUserData";
import { getPrayersArray, calculateProgressStats, formatNumber } from "@/lib/prayer-utils";

export const ProgressSection = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { userData, loading, refreshData } = useUserData();

  // Обновление данных после добавления намазов
  const handleDataUpdate = () => {
    refreshData();
  };

  // Мемоизация массива намазов
  const prayers = useMemo(() => getPrayersArray(userData), [userData]);

  // Мемоизация статистики
  const stats = useMemo(() => calculateProgressStats(userData), [userData]);

  // Если данных нет, показываем сообщение
  if (!userData) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                Для отображения прогресса необходимо сначала рассчитать долг намазов
              </p>
              <Button
                onClick={() => {
                  // Переключение на вкладку калькулятора
                  const calculatorTab = document.querySelector('[data-tab="calculator"]') as HTMLElement;
                  if (calculatorTab) {
                    calculatorTab.click();
                  } else {
                    // Fallback - прокрутка к началу страницы
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="bg-primary"
              >
                Перейти к расчёту
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Overall Progress Card */}
      <Card className="bg-gradient-card shadow-medium border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Общий прогресс</CardTitle>
              <CardDescription>
                Восполнено {formatNumber(stats.totalCompleted)} из {formatNumber(stats.totalMissed)} намазов
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold gradient-text">
                {stats.overallProgress}%
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stats.dailyPace} намазов/день
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={stats.overallProgress} className="h-4" />
          <div className="mt-4 flex justify-between text-sm text-muted-foreground">
            <span>Начато {stats.startDate.toLocaleDateString("ru-RU")}</span>
            <span>Осталось {formatNumber(stats.remaining)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Add Prayer Button */}
      <Button
        onClick={() => setDialogOpen(true)}
        size="lg"
        className="w-full bg-primary hover:opacity-90 transition-opacity shadow-glow"
      >
        <Plus className="w-5 h-5 mr-2" />
        Отметить восполненные намазы
      </Button>

      {/* Individual Prayer Progress */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prayers.map((prayer) => (
          <PrayerProgressCard key={prayer.name} {...prayer} />
        ))}
      </div>

      {/* Stats Card */}
      <Card className="bg-gradient-dusk text-white shadow-strong">
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.dailyPace}</div>
              <div className="text-sm opacity-90">Намазов/день</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.weeklyPace}</div>
              <div className="text-sm opacity-90">Намазов/неделя</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {stats.monthsToComplete > 0 ? `${stats.monthsToComplete} мес.` : `${stats.daysToComplete} дн.`}
              </div>
              <div className="text-sm opacity-90">До завершения</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AddPrayerDialog open={dialogOpen} onOpenChange={setDialogOpen} onUpdate={handleDataUpdate} />
    </div>
  );
};
