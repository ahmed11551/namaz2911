import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Share2, TrendingUp, Calendar, Target, Clock, Loader2, Flame, Trophy, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { eReplikaAPI, spiritualPathAPI } from "@/lib/api";
import { useUserData } from "@/hooks/useUserData";
import { calculateProgressStats, formatNumber } from "@/lib/prayer-utils";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import type { Streak, Badge } from "@/types/spiritual-path";

export const ReportsSection = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userData, loading: userDataLoading, refreshData } = useUserData();
  const [loading, setLoading] = useState(false);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);

  // Обновляем данные при монтировании и при событиях обновления
  useEffect(() => {
    const handleDataUpdate = () => {
      refreshData();
    };

    window.addEventListener('userDataUpdated', handleDataUpdate);
    loadExtras();
    
    return () => {
      window.removeEventListener('userDataUpdated', handleDataUpdate);
    };
  }, [refreshData]);

  const loadExtras = async () => {
    try {
      const [streaksData, badgesData] = await Promise.all([
        spiritualPathAPI.getStreaks(),
        spiritualPathAPI.getBadges(),
      ]);
      setStreaks(streaksData);
      setBadges(badgesData);
    } catch (error) {
      console.error("Error loading extras:", error);
    }
  };

  const currentStreak = streaks.find(s => s.streak_type === "daily_all")?.current_streak || 0;
  const longestStreak = streaks.find(s => s.streak_type === "daily_all")?.longest_streak || 0;

  // Валидация данных перед расчетом статистики
  const isValidUserData = useMemo(() => {
    if (!userData) return false;
    
    // Проверяем наличие обязательных полей
    const hasDebtCalculation = userData.debt_calculation && 
      typeof userData.debt_calculation === 'object' &&
      userData.debt_calculation.missed_prayers &&
      typeof userData.debt_calculation.missed_prayers === 'object';
    
    const hasRepaymentProgress = userData.repayment_progress &&
      typeof userData.repayment_progress === 'object' &&
      userData.repayment_progress.completed_prayers &&
      typeof userData.repayment_progress.completed_prayers === 'object';
    
    return hasDebtCalculation && hasRepaymentProgress;
  }, [userData]);

  // Мемоизация статистики с обработкой ошибок
  const stats = useMemo(() => {
    try {
      if (!isValidUserData) {
        return calculateProgressStats(null);
      }
      return calculateProgressStats(userData);
    } catch (error) {
      console.error("Error calculating stats:", error);
      return calculateProgressStats(null);
    }
  }, [userData, isValidUserData]);

  const handleDownloadPDF = async () => {
    if (!userData) {
      toast({
        title: "Ошибка",
        description: "Нет данных для формирования отчёта",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Генерация через e-Replika API
      const userId = userData.user_id || `user_${Date.now()}`;
      const blob = await eReplikaAPI.generatePDFReport(userId, userData);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prayer-debt-report-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: "PDF отчёт скачан",
        description: "Отчёт успешно сохранён",
      });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast({
        title: "Ошибка генерации PDF",
        description: error instanceof Error ? error.message : "Не удалось сгенерировать PDF отчёт. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    toast({
      title: "Поделиться прогрессом",
      description: "Используйте функцию 'Поделиться' в разделе достижений",
    });
  };

  // Мемоизация массива статистики с безопасной обработкой даты
  const statsArray = useMemo(() => {
    if (userDataLoading || !userData || !isValidUserData) {
      return [];
    }

    try {
      const startDate =
        stats.startDate instanceof Date && !isNaN(stats.startDate.getTime())
          ? stats.startDate
          : new Date();

      return [
        {
          icon: Calendar,
          label: "Дата начала",
          value: startDate.toLocaleDateString("ru-RU", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          description: "Начало отслеживания",
        },
        {
          icon: Target,
          label: "Всего восполнено",
          value: formatNumber(stats.totalCompleted),
          description: "намазов выполнено",
        },
        {
          icon: TrendingUp,
          label: "Осталось",
          value: formatNumber(stats.remaining),
          description: "намазов до завершения",
        },
        {
          icon: Clock,
          label: "Средний темп",
          value: `${stats.dailyPace}/день`,
          description: "намазов в день",
        },
      ];
    } catch (error) {
      console.error("Error creating stats array:", error);
      return [];
    }
  }, [stats, userDataLoading, userData, isValidUserData]);

  // Показываем загрузку
  if (userDataLoading) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">
                Загрузка данных...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Показываем сообщение, если нет данных или данные невалидны
  if (!userData || !isValidUserData) {
    return (
      <div className="space-y-6 animate-in fade-in-50 duration-500">
        <Card className="bg-gradient-card shadow-medium border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">
                {!userData 
                  ? "Для отображения отчётов необходимо сначала рассчитать долг намазов"
                  : "Данные неполные. Пожалуйста, выполните расчет заново."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Streak Card */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm mb-1">Текущая серия</p>
            <p className="text-4xl font-bold">{currentStreak}</p>
            <p className="text-orange-100 text-xs mt-1">дней подряд</p>
          </div>
          <div className="text-right">
            <Flame className="w-12 h-12 text-orange-200" />
            <p className="text-orange-100 text-xs mt-1">Рекорд: {longestStreak}</p>
          </div>
        </div>
      </div>

      {/* Main Progress Card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Прогресс каза</h3>
          <span className="text-2xl font-bold text-emerald-600">{stats.overallProgress}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${stats.overallProgress}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-lg font-bold text-emerald-700">{formatNumber(stats.totalCompleted)}</p>
            <p className="text-xs text-emerald-600">Восполнено</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-lg font-bold text-gray-700">{formatNumber(stats.remaining)}</p>
            <p className="text-xs text-gray-500">Осталось</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-lg font-bold text-blue-700">{stats.dailyPace}/д</p>
            <p className="text-xs text-blue-600">Темп</p>
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">За неделю</h3>
        <div className="h-32 flex items-end justify-between gap-2">
          {[10, 12, 8, 15, 11, 13, 14].map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={cn(
                  "w-full rounded-lg transition-all duration-300",
                  value > 10 ? "bg-emerald-500" : "bg-emerald-200"
                )}
                style={{ height: `${(value / 15) * 100}%` }}
              />
              <span className="text-[10px] text-gray-500">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"][index]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        {statsArray.slice(0, 2).map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <stat.icon className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-sm text-gray-500">{stat.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Forecast Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
        <h3 className="font-semibold mb-3">Прогноз завершения</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-3xl font-bold">{stats.monthsToComplete}</p>
            <p className="text-emerald-100 text-sm">месяцев</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{stats.daysRemaining}</p>
            <p className="text-emerald-100 text-sm">дней</p>
          </div>
        </div>
        <p className="text-emerald-100 text-xs mt-3">
          При темпе {stats.dailyPace} намазов в день
        </p>
      </div>

      {/* Achievements Preview */}
      <button
        onClick={() => navigate("/statistics")}
        className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all"
      >
        <div className="w-12 h-12 rounded-xl bg-yellow-50 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-yellow-500" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="font-semibold text-gray-900">Достижения</h3>
          <p className="text-sm text-gray-500">{badges.length} бейджей получено</p>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleDownloadPDF}
          disabled={loading}
          className="rounded-xl h-12 bg-emerald-500 hover:bg-emerald-600"
        >
          <Download className="w-4 h-4 mr-2" />
          {loading ? "..." : "PDF"}
        </Button>
        <Button
          onClick={handleShare}
          variant="outline"
          className="rounded-xl h-12 border-gray-200"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Поделиться
        </Button>
      </div>
    </div>
  );
};
