// Компонент для управления напоминаниями о восполнении намазов

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, BellOff, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useUserData } from "@/hooks/useUserData";
import { calculateProgressStats } from "@/lib/prayer-utils";

interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:mm format
  frequency: "daily" | "twice" | "custom";
  customTimes?: string[]; // For custom frequency
  message?: string;
}

const REMINDER_STORAGE_KEY = "prayer_reminder_settings";

export const RemindersManager = () => {
  const { toast } = useToast();
  const { userData } = useUserData();
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: false,
    time: "09:00",
    frequency: "daily",
  });
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");

  // Загружаем настройки из localStorage
  useEffect(() => {
    const saved = localStorage.getItem(REMINDER_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setSettings(parsed);
        }
      } catch (error) {
        console.error("Failed to parse reminder settings:", error);
      }
    }

    // Проверяем разрешение на уведомления
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Сохраняем настройки
  const saveSettings = (newSettings: ReminderSettings) => {
    localStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  // Запрашиваем разрешение на уведомления
  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Уведомления не поддерживаются",
        description: "Ваш браузер не поддерживает уведомления",
        variant: "destructive",
      });
      return;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);

    if (permission === "granted") {
      toast({
        title: "Разрешение получено",
        description: "Теперь вы будете получать напоминания",
      });
    } else {
      toast({
        title: "Разрешение отклонено",
        description: "Вы не будете получать напоминания. Вы можете включить их в настройках браузера.",
        variant: "destructive",
      });
    }
  };

  // Получаем ежедневную цель
  const dailyGoal = useMemo(() => {
    if (userData?.repayment_progress?.completed_prayers) {
      const totalCompleted = Object.values(
        userData.repayment_progress.completed_prayers
      ).reduce((sum, val) => sum + (val || 0), 0);
      
      if (userData.debt_calculation?.period?.start) {
        const startDate = new Date(userData.debt_calculation.period.start);
        const daysSinceStart = Math.max(
          1,
          Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        return Math.round(totalCompleted / daysSinceStart) || 10;
      }
    }
    return 10;
  }, [userData]);

  // Получаем статистику прогресса
  const stats = useMemo(() => calculateProgressStats(userData), [userData]);

  // Включаем/выключаем напоминания
  const toggleReminders = (enabled: boolean) => {
    if (enabled && permissionStatus !== "granted") {
      requestPermission();
      return;
    }

    const newSettings = { ...settings, enabled };
    saveSettings(newSettings);

    if (enabled) {
      toast({
        title: "Напоминания включены",
        description: `Вы будете получать напоминания в ${settings.time}`,
      });
    } else {
      toast({
        title: "Напоминания выключены",
      });
    }
  };

  // Показываем тестовое уведомление
  const testNotification = () => {
    if (permissionStatus !== "granted") {
      requestPermission();
      return;
    }

    const message = settings.message || `Не забудьте восполнить намазы! Ваша цель сегодня: ${dailyGoal} намазов.`;
    
    new Notification("Трекер намазов", {
      body: message,
      icon: "/logo.svg",
      badge: "/logo.svg",
      tag: "prayer-reminder",
    });

    toast({
      title: "Тестовое уведомление отправлено",
      description: "Проверьте уведомления на вашем устройстве",
    });
  };

  // Планируем напоминания
  useEffect(() => {
    if (!settings.enabled || permissionStatus !== "granted") {
      return;
    }

    // Функция для расчета времени следующего напоминания
    const getNextNotificationTime = (time: string): number => {
      const [hours, minutes] = time.split(":").map(Number);
      const now = new Date();
      const notificationTime = new Date();
      notificationTime.setHours(hours, minutes, 0, 0);

      // Если время уже прошло сегодня, планируем на завтра
      if (notificationTime.getTime() <= now.getTime()) {
        notificationTime.setDate(notificationTime.getDate() + 1);
      }

      return notificationTime.getTime() - now.getTime();
    };

    // Функция для отправки напоминания
    const sendReminder = () => {
      if (permissionStatus !== "granted") return;

      const message = settings.message || `Не забудьте восполнить намазы! Ваша цель сегодня: ${dailyGoal} намазов.`;
      
      try {
        new Notification("Трекер намазов", {
          body: message,
          icon: "/logo.svg",
          badge: "/logo.svg",
          tag: "prayer-reminder",
          requireInteraction: false,
        });
      } catch (error) {
        console.error("Error showing notification:", error);
      }
    };

    // Планируем напоминания в зависимости от частоты
    const timeouts: NodeJS.Timeout[] = [];

    if (settings.frequency === "daily") {
      const delay = getNextNotificationTime(settings.time);
      const timeout = setTimeout(() => {
        sendReminder();
        // Планируем следующее напоминание на завтра
        const dailyInterval = setInterval(() => {
          sendReminder();
        }, 24 * 60 * 60 * 1000); // 24 часа
        timeouts.push(dailyInterval);
      }, delay);
      timeouts.push(timeout);
    } else if (settings.frequency === "twice") {
      // Два раза в день: утром и вечером
      const morningTime = settings.time;
      const eveningTime = settings.time.split(":")[0] + ":20"; // +12 часов (примерно)
      
      const morningDelay = getNextNotificationTime(morningTime);
      const eveningDelay = getNextNotificationTime(eveningTime);
      
      const morningTimeout = setTimeout(() => {
        sendReminder();
        const interval = setInterval(() => sendReminder(), 24 * 60 * 60 * 1000);
        timeouts.push(interval);
      }, morningDelay);
      
      const eveningTimeout = setTimeout(() => {
        sendReminder();
        const interval = setInterval(() => sendReminder(), 24 * 60 * 60 * 1000);
        timeouts.push(interval);
      }, eveningDelay);
      
      timeouts.push(morningTimeout, eveningTimeout);
    }

    return () => {
      // Очищаем все таймеры при размонтировании или изменении настроек
      timeouts.forEach((timeout) => {
        clearTimeout(timeout);
        clearInterval(timeout);
      });
    };
  }, [settings, permissionStatus, dailyGoal]);

  return (
    <Card className="bg-gradient-card shadow-medium border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <CardTitle>Напоминания</CardTitle>
        </div>
        <CardDescription>
          Настройте напоминания о ежедневной цели восполнения намазов
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        {permissionStatus !== "granted" && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {permissionStatus === "default" ? (
                <div className="space-y-2">
                  <p>Для работы напоминаний необходимо разрешение на уведомления.</p>
                  <Button onClick={requestPermission} size="sm" className="mt-2">
                    Разрешить уведомления
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>Разрешение на уведомления отклонено. Включите его в настройках браузера.</p>
                  <p className="text-xs text-muted-foreground">
                    Chrome: Настройки → Конфиденциальность → Уведомления
                  </p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Enable/Disable */}
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-secondary/50">
          <div className="space-y-0.5">
            <Label htmlFor="reminders-enabled" className="text-base font-semibold">
              Включить напоминания
            </Label>
            <p className="text-sm text-muted-foreground">
              Получайте напоминания о ежедневной цели восполнения
            </p>
          </div>
          <Switch
            id="reminders-enabled"
            checked={settings.enabled}
            onCheckedChange={toggleReminders}
            disabled={permissionStatus !== "granted"}
          />
        </div>

        {/* Settings (only if enabled) */}
        {settings.enabled && permissionStatus === "granted" && (
          <div className="space-y-4 p-4 rounded-lg border border-border bg-secondary/30">
            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Время напоминания</Label>
              <Input
                id="reminder-time"
                type="time"
                value={settings.time}
                onChange={(e) => saveSettings({ ...settings, time: e.target.value })}
                className="w-full"
              />
            </div>

            {/* Frequency */}
            <div className="space-y-2">
              <Label htmlFor="reminder-frequency">Частота</Label>
              <Select
                value={settings.frequency}
                onValueChange={(value: "daily" | "twice" | "custom") =>
                  saveSettings({ ...settings, frequency: value })
                }
              >
                <SelectTrigger id="reminder-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Один раз в день</SelectItem>
                  <SelectItem value="twice">Два раза в день</SelectItem>
                  <SelectItem value="custom">Настраиваемое</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <Label htmlFor="reminder-message">Сообщение (необязательно)</Label>
              <Input
                id="reminder-message"
                placeholder={`Не забудьте восполнить намазы! Ваша цель сегодня: ${dailyGoal} намазов.`}
                value={settings.message || ""}
                onChange={(e) => saveSettings({ ...settings, message: e.target.value })}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Если оставить пустым, будет использовано сообщение по умолчанию
              </p>
            </div>

            {/* Current Goal Info */}
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-medium">Текущая ежедневная цель:</span>
                <span className="text-primary font-bold">{dailyGoal} намазов/день</span>
              </div>
              {stats.remaining > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Осталось восполнить: {stats.remaining.toLocaleString("ru-RU")} намазов
                </div>
              )}
            </div>

            {/* Test Button */}
            <Button onClick={testNotification} variant="outline" className="w-full">
              <Bell className="w-4 h-4 mr-2" />
              Отправить тестовое уведомление
            </Button>
          </div>
        )}

        {/* Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Примечание:</strong> Эти напоминания работают, пока приложение открыто.
            Для фоновых уведомлений включите раздел «Фоновые уведомления» в настройках умных уведомлений.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

