import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Bell, Compass, Flame, Moon, Navigation, Sparkles, Target } from "lucide-react";
import { format, differenceInMinutes, formatDistanceToNowStrict } from "date-fns";
import { ru } from "date-fns/locale";
import { spiritualPathAPI } from "@/lib/api";
import type { Goal, NotificationSettings, SmartNotification } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type DiscoverSectionProps = {
  onNavigate?: (tab: string) => void;
};

type PrayerTime = {
  name: string;
  slug: string;
  time: Date;
};

const createDefaultPrayerTimes = (): PrayerTime[] => {
  const now = new Date();
  const build = (hours: number, minutes: number, slug: string, name: string) => {
    const instance = new Date(now);
    instance.setHours(hours, minutes, 0, 0);
    return { name, slug, time: instance };
  };
  return [
    build(5, 30, "fajr", "Фаджр"),
    build(12, 45, "dhuhr", "Зухр"),
    build(15, 20, "asr", "Аср"),
    build(18, 5, "maghrib", "Магриб"),
    build(19, 45, "isha", "Иша"),
  ];
};

const getNextPrayerInfo = (times: PrayerTime[]) => {
  const now = new Date();
  const upcoming = [...times]
    .filter((p) => p.time.getTime() > now.getTime())
    .sort((a, b) => a.time.getTime() - b.time.getTime())[0];

  if (upcoming) {
    return { prayer: upcoming, isTomorrow: false };
  }

  const tomorrow = { ...times[0], time: new Date(times[0].time.getTime() + 24 * 60 * 60 * 1000) };
  return { prayer: tomorrow, isTomorrow: true };
};

const loadTasbihStats = () => {
  try {
    const raw = localStorage.getItem("smart_tasbih_stats");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const DiscoverSection = ({ onNavigate }: DiscoverSectionProps) => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [tasbihStats, setTasbihStats] = useState<{ total?: number; streak?: number }>({});
  const [prayerTimes] = useState<PrayerTime[]>(createDefaultPrayerTimes());

  useEffect(() => {
    const load = async () => {
      try {
        const [goalData, notificationData, settingsData] = await Promise.all([
          spiritualPathAPI.getGoals("active"),
          spiritualPathAPI.getNotifications(),
          spiritualPathAPI.getNotificationSettings(),
        ]);
        setGoals(goalData);
        setNotifications(notificationData);
        setNotificationSettings(settingsData);
      } catch (error) {
        console.error("Error loading discover data:", error);
      }
    };
    load();
    setTasbihStats(loadTasbihStats());
  }, []);

  const nextPrayer = useMemo(() => getNextPrayerInfo(prayerTimes), [prayerTimes]);

  const goalsSummary = useMemo(() => {
    if (!goals.length) return { total: 0, avgProgress: 0 };
    const totalProgress = goals.reduce((sum, goal) => sum + Math.min(goal.current_value / goal.target_value, 1), 0);
    return {
      total: goals.length,
      avgProgress: Math.round((totalProgress / goals.length) * 100),
    };
  }, [goals]);

  const notificationsSummary = useMemo(() => {
    if (!notificationSettings) {
      return {
        enabled: false,
        telegram: false,
        push: false,
        pending: 0,
      };
    }
    return {
      enabled: notificationSettings.enabled,
      telegram: notificationSettings.telegram_enabled,
      push: notificationSettings.push_enabled,
      pending: notifications.length,
    };
  }, [notificationSettings, notifications]);

  const timeUntilNext = useMemo(() => {
    if (!nextPrayer?.prayer) return null;
    const diff = differenceInMinutes(nextPrayer.prayer.time, new Date());
    if (diff <= 0) return "Скоро обновится";
    if (diff >= 60) {
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      return `${hours} ч ${minutes} мин`;
    }
    return `${diff} мин`;
  }, [nextPrayer]);

  const navigateToTab = (tab: string) => {
    onNavigate?.(tab);
    navigate(tab === "overview" ? "/" : `/?tab=${tab}`, { replace: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToDhikr = () => {
    navigate("/dhikr");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const quickActions = [
    {
      label: "Цели",
      description: "Проверь активные цели",
      icon: <Target className="w-4 h-4 text-primary" />,
      action: () => navigateToTab("goals"),
    },
    {
      label: "Уведомления",
      description: "Настрой умные напоминания",
      icon: <Bell className="w-4 h-4 text-primary" />,
      action: () => navigateToTab("calendar"),
    },
    {
      label: "Тасбих",
      description: "Продолжи сессию",
      icon: <Sparkles className="w-4 h-4 text-primary" />,
      action: goToDhikr,
    },
  ];

  return (
    <section className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Мой день</h2>
          <p className="text-sm text-muted-foreground">Быстрый обзор прогресса и важных напоминаний</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigateToTab("reports")}>
          Аналитика
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Moon className="w-4 h-4 text-primary" />
                Следующий намаз
              </CardTitle>
              <CardDescription>Планируй день вокруг намазов</CardDescription>
            </div>
            <Badge variant="outline">{nextPrayer.isTomorrow ? "Завтра" : "Сегодня"}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextPrayer?.prayer ? (
              <>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold">{nextPrayer.prayer.name}</span>
                  <span className="text-lg text-muted-foreground">
                    {format(nextPrayer.prayer.time, "HH:mm")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Осталось: <span className="font-semibold text-foreground">{timeUntilNext}</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Загрузка расписания…</p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Navigation className="w-3.5 h-3.5" />
              <span>Данные автоматически обновляются по местному времени</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" />
                Прогресс по целям
              </CardTitle>
              <CardDescription>{goalsSummary.total ? `Активных целей: ${goalsSummary.total}` : "Загрузка…"}</CardDescription>
            </div>
            <Badge>{goalsSummary.avgProgress}%</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={goalsSummary.avgProgress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Продолжай работать над целями. Мы готовы подсказать следующую задачу.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigateToTab("goals")}>
              Управлять целями
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Smart Tasbih
              </CardTitle>
              <CardDescription>Автоматическая синхронизация с целями</CardDescription>
            </div>
            {tasbihStats?.streak ? (
              <Badge variant="secondary">Серия {tasbihStats.streak} д.</Badge>
            ) : (
              <Badge variant="outline">Готов к зикру</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {tasbihStats?.total
                ? `В последний раз вы прочитали ${tasbihStats.total.toLocaleString("ru-RU")} зикров.`
                : "Начни сессию тасбиха и автоматически засчитывай прогресс по целям."}
            </p>
            <Button variant="outline" size="sm" onClick={goToDhikr}>
              Открыть Smart Tasbih
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Умные уведомления
              </CardTitle>
              <CardDescription>
                {notificationsSummary.enabled ? "Напоминания активны" : "Уведомления выключены"}
              </CardDescription>
            </div>
            {notificationsSummary.pending ? (
              <Badge variant="secondary">{notificationsSummary.pending} событий</Badge>
            ) : (
              <Badge variant="outline">Всё спокойно</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div className="p-2 rounded-lg border bg-secondary/40">
                <p className="font-semibold">{notificationsSummary.enabled ? "ON" : "OFF"}</p>
                <p className="text-muted-foreground">Браузер</p>
              </div>
              <div className="p-2 rounded-lg border bg-secondary/40">
                <p className="font-semibold">{notificationsSummary.push ? "ON" : "OFF"}</p>
                <p className="text-muted-foreground">Фоновые</p>
              </div>
              <div className="p-2 rounded-lg border bg-secondary/40">
                <p className="font-semibold">{notificationsSummary.telegram ? "ON" : "OFF"}</p>
                <p className="text-muted-foreground">Telegram</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateToTab("calendar")}>
              Настроить уведомления
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            Быстрые действия
          </CardTitle>
          <CardDescription>Чаще используемые разделы</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.action}
              className={cn(
                "p-4 rounded-xl border border-border/50 bg-secondary/40",
                "text-left transition hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              <div className="flex items-center gap-2 text-sm font-semibold mb-1">
                {action.icon}
                {action.label}
              </div>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      {notificationSettings?.enabled === false && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4" />
          Включите умные уведомления, чтобы получать напоминания о целях и намазах.
        </div>
      )}
    </section>
  );
};

