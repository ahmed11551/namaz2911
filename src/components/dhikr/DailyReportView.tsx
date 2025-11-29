// Компонент для отображения ежедневного отчета с тепловой картой активности

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Target, CheckCircle2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { smartTasbihAPI } from "@/lib/api";
import { ActivityHeatmap } from "./ActivityHeatmap";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface DailyReportData {
  date: string;
  tz: string;
  goals_completed: Array<{
    id: string;
    category: string;
    target_count: number;
    progress: number;
  }>;
  azkar_progress: {
    fajr: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
    total: number;
    is_complete: boolean;
  };
  total_dhikr_count: number;
  hourly_activity?: number[];
  max_activity?: number;
}

interface DailyReportViewProps {
  className?: string;
}

export const DailyReportView = ({ className }: DailyReportViewProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loadReport = async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const data = await smartTasbihAPI.getDailyReport(dateStr);
      setReportData(data as DailyReportData);
    } catch (error) {
      console.error("Error loading daily report:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить отчет",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(selectedDate);
  }, [selectedDate]);

  const handlePreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate);
  };

  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    // Не позволяем выбирать будущие даты
    if (nextDate <= new Date()) {
      setSelectedDate(nextDate);
    }
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  if (loading) {
    return (
      <Card className={cn("bg-gradient-card border-border/50", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!reportData) {
    return (
      <Card className={cn("bg-gradient-card border-border/50", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Нет данных для отображения</p>
        </CardContent>
      </Card>
    );
  }

  const azkarTotal = reportData.azkar_progress.total;
  const azkarMax = 495; // 5x99
  const azkarProgress = (azkarTotal / azkarMax) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Заголовок с навигацией по датам */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Ежедневный отчет
              </CardTitle>
              <CardDescription>
                {format(selectedDate, "d MMMM yyyy", { locale: ru })}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousDay}
                disabled={loading}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                disabled={isToday || loading}
              >
                Сегодня
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextDay}
                disabled={!isToday || loading}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Основная статистика */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Всего зикров
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {reportData.total_dhikr_count}
            </div>
            <p className="text-xs text-muted-foreground mt-1">за день</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Выполнено целей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {reportData.goals_completed.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">целей завершено</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ежедневные азкары
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {azkarTotal}/{azkarMax}
            </div>
            <Progress value={azkarProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {reportData.azkar_progress.is_complete ? "✅ Завершено" : "В процессе"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Тепловая карта активности */}
      {reportData.hourly_activity && reportData.max_activity !== undefined && (
        <ActivityHeatmap
          hourlyActivity={reportData.hourly_activity}
          maxActivity={reportData.max_activity}
          timezone={reportData.tz}
        />
      )}

      {/* Прогресс по ежедневным азкарам */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Ежедневные азкары (5x99)</CardTitle>
          <CardDescription>Прогресс по сегментам намаза</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Фаджр", value: reportData.azkar_progress.fajr, icon: "🌅" },
            { label: "Зухр", value: reportData.azkar_progress.dhuhr, icon: "☀️" },
            { label: "Аср", value: reportData.azkar_progress.asr, icon: "🌤️" },
            { label: "Магриб", value: reportData.azkar_progress.maghrib, icon: "🌆" },
            { label: "Иша", value: reportData.azkar_progress.isha, icon: "🌙" },
          ].map((segment) => {
            const progress = (segment.value / 99) * 100;
            const isComplete = segment.value >= 99;
            return (
              <div key={segment.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{segment.icon}</span>
                    <span className="font-medium">{segment.label}</span>
                  </div>
                  <Badge variant={isComplete ? "default" : "outline"}>
                    {segment.value}/99
                  </Badge>
                </div>
                <Progress
                  value={progress}
                  className={cn("h-2", isComplete && "bg-primary")}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Завершенные цели */}
      {reportData.goals_completed.length > 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Завершенные цели
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reportData.goals_completed.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50"
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {goal.category === "azkar" ? "Азкары" : goal.category}
                    </span>
                  </div>
                  <Badge variant="default">
                    {goal.progress}/{goal.target_count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

