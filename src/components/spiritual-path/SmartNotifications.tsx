// Компонент для управления умными уведомлениями
// Интеграция с Telegram Bot API

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  BellOff,
  Clock,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import type { NotificationSettings, SmartNotification } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { getTelegramWebApp } from "@/lib/telegram";
import {
  enableBackgroundNotifications,
  disableBackgroundNotifications,
  getPushCapability,
  sendLocalNotification,
  type PushCapability,
} from "@/lib/push-client";

// TODO: Получить настройки из API
const getDefaultSettings = (): NotificationSettings => ({
  user_id: "",
  enabled: false,
  telegram_enabled: false,
  notification_period_start: "08:00",
  notification_period_end: "22:00",
  daily_reminder_enabled: true,
  motivation_enabled: true,
  badge_notifications_enabled: true,
  push_enabled: false,
  push_subscription_status: "not_supported",
});

export const SmartNotifications = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(getDefaultSettings());
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default");
  const [pushCapability, setPushCapability] = useState<PushCapability>({
    supported: false,
    permission: "default",
    vapidReady: Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY),
    subscribed: false,
  });
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const telegramBotLink = import.meta.env.VITE_TELEGRAM_BOT_LINK || "https://t.me/mubarakway_bot";

  useEffect(() => {
    loadSettings();
    loadNotifications();
    
    // Проверяем разрешение на уведомления браузера
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const refreshPushCapability = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      const capability = await getPushCapability();
      setPushCapability(capability);
    } catch (error) {
      setPushError((error as Error).message);
    }
  }, []);

  useEffect(() => {
    refreshPushCapability();
  }, [refreshPushCapability]);

  const loadSettings = async () => {
    try {
      const data = await spiritualPathAPI.getNotificationSettings();
      setSettings({
        ...getDefaultSettings(),
        ...data,
      });
    } catch (error) {
      console.error("Error loading settings:", error);
      // Используем настройки по умолчанию
    }
  };

  const loadNotifications = async () => {
    try {
      const data = await spiritualPathAPI.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    setLoading(true);
    try {
      const updated = await spiritualPathAPI.updateNotificationSettings(newSettings);
      setSettings(updated);
      toast({
        title: "Настройки сохранены",
        description: "Уведомления обновлены",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleTimeChange = (key: "notification_period_start" | "notification_period_end", value: string) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const handleOpenTelegramBot = () => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.openTelegramLink(telegramBotLink);
    } else {
      window.open(telegramBotLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleBackgroundToggle = async (checked: boolean) => {
    setPushLoading(true);
    setPushError(null);

    try {
      if (checked) {
        await enableBackgroundNotifications();
        await saveSettings({
          ...settings,
          push_enabled: true,
          push_subscription_status: "subscribed",
          last_push_check: new Date().toISOString(),
        });
      } else {
        await disableBackgroundNotifications();
        await saveSettings({
          ...settings,
          push_enabled: false,
          push_subscription_status: "inactive",
        });
      }
      await refreshPushCapability();
    } catch (error) {
      console.error("Error toggling background notifications:", error);
      setPushError((error as Error).message);
      await saveSettings({
        ...settings,
        push_enabled: false,
        push_subscription_status: "error",
      });
    } finally {
      setPushLoading(false);
    }
  };

  const requestBrowserPermission = async () => {
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
    refreshPushCapability();

    if (permission === "granted") {
      toast({
        title: "Разрешение получено",
        description: "Теперь вы будете получать уведомления браузера",
      });
    } else {
      toast({
        title: "Разрешение отклонено",
        description: "Вы не будете получать уведомления браузера. Вы можете включить их в настройках браузера.",
        variant: "destructive",
      });
    }
  };

  const sendTestNotification = async () => {
    // Если включены уведомления браузера, проверяем разрешение
    if (settings.enabled && permissionStatus !== "granted") {
      await requestBrowserPermission();
      return;
    }

    let delivered = false;

    if (pushCapability.subscribed) {
      await sendLocalNotification(
        "Умные уведомления",
        "Это тестовое фоновое уведомление. Проверьте центр уведомлений."
      );
      delivered = true;
    }

    // Отправляем тестовое уведомление браузера, если разрешено
    if (settings.enabled && permissionStatus === "granted") {
      try {
        new Notification("Умные уведомления", {
          body: "Это тестовое уведомление. Ваши настройки работают корректно!",
          icon: "/logo.svg",
          badge: "/logo.svg",
          tag: "smart-notification-test",
        });
        delivered = true;
      } catch (error) {
        console.error("Error showing browser notification:", error);
      }
    }

    // Отправляем через Telegram API, если включено
    if (settings.telegram_enabled) {
      try {
        await spiritualPathAPI.sendTestNotification();
        delivered = true;
      } catch (error) {
        console.error("Error sending test notification:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось отправить Telegram уведомление. Убедитесь, что уведомления включены.",
          variant: "destructive",
        });
      }
    }

    if (delivered) {
      toast({
        title: "Тестовое уведомление отправлено",
        description: "Проверьте Telegram и центр уведомлений вашего устройства",
      });
    } else {
      toast({
        title: "Уведомления не настроены",
        description: "Включите их в настройках и разрешите в браузере",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6 text-primary" />
          Умные уведомления
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Персонализированные напоминания и мотивация в Telegram
        </p>
      </div>

      {/* Основные настройки */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Настройки уведомлений
          </CardTitle>
          <CardDescription>
            Управляйте уведомлениями о ваших целях
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Статус разрешений браузера */}
          {permissionStatus !== "granted" && (
            <div className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium">
                    {permissionStatus === "default" 
                      ? "Для работы уведомлений необходимо разрешение браузера"
                      : "Разрешение на уведомления отклонено"}
                  </p>
                  {permissionStatus === "default" ? (
                    <Button onClick={requestBrowserPermission} size="sm" variant="outline">
                      Разрешить уведомления
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Включите уведомления в настройках браузера: Настройки → Конфиденциальность → Уведомления
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Включить/выключить уведомления */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-enabled" className="text-base">
                Включить уведомления
              </Label>
              <p className="text-sm text-muted-foreground">
                Получать уведомления о прогрессе целей
              </p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={settings.enabled}
              onCheckedChange={async (checked) => {
                if (checked && permissionStatus !== "granted") {
                  await requestBrowserPermission();
                  if (Notification.permission !== "granted") {
                    return;
                  }
                }
                handleToggle("enabled", checked);
                if (!checked && pushCapability.subscribed) {
                  handleBackgroundToggle(false);
                }
              }}
            />
          </div>

          {/* Фоновые уведомления через Service Worker */}
          {settings.enabled && (
            <div className="space-y-3 rounded-lg border border-border/50 bg-secondary/40 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Фоновые уведомления</Label>
                  <p className="text-sm text-muted-foreground">
                    Работают даже если приложение закрыто
                  </p>
                </div>
                <Switch
                  checked={pushCapability.subscribed}
                  onCheckedChange={handleBackgroundToggle}
                  disabled={
                    pushLoading ||
                    !pushCapability.supported ||
                    !pushCapability.vapidReady ||
                    pushCapability.permission === "denied"
                  }
                />
              </div>
              {!pushCapability.supported && (
                <p className="text-xs text-muted-foreground">
                  Ваш браузер не поддерживает Service Worker и Push API. Попробуйте обновить его или использовать Chrome/Edge.
                </p>
              )}
              {!pushCapability.vapidReady && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Фоновые уведомления будут доступны после настройки серверного ключа. Свяжитесь с администрацией.
                  </AlertDescription>
                </Alert>
              )}
              {pushCapability.permission === "denied" && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Разрешите уведомления в настройках браузера, чтобы активировать фоновые напоминания.
                  </AlertDescription>
                </Alert>
              )}
              {pushError && (
                <Alert variant="destructive">
                  <AlertDescription>{pushError}</AlertDescription>
                </Alert>
              )}
              {pushCapability.subscribed && (
                <Badge variant="outline" className="w-fit">
                  Фоновые уведомления активны
                </Badge>
              )}
            </div>
          )}

          {/* Telegram уведомления */}
          {settings.enabled && (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="telegram-enabled" className="text-base">
                  Telegram уведомления
                </Label>
                <p className="text-sm text-muted-foreground">
                  Отправлять уведомления в Telegram
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="telegram-enabled"
                  checked={settings.telegram_enabled}
                  onCheckedChange={(checked) => handleToggle("telegram_enabled", checked)}
                  disabled={!settings.enabled}
                />
                {settings.telegram_enabled && (
                  <Button variant="ghost" size="sm" onClick={handleOpenTelegramBot}>
                    Открыть бота
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Период уведомлений */}
          {settings.enabled && settings.telegram_enabled && (
            <div className="space-y-4 p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <Label className="text-base">Период уведомлений</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="period-start" className="text-sm">
                    С
                  </Label>
                  <Input
                    id="period-start"
                    type="time"
                    value={settings.notification_period_start}
                    onChange={(e) => handleTimeChange("notification_period_start", e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="period-end" className="text-sm">
                    До
                  </Label>
                  <Input
                    id="period-end"
                    type="time"
                    value={settings.notification_period_end}
                    onChange={(e) => handleTimeChange("notification_period_end", e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Типы уведомлений */}
          {settings.enabled && (
            <div className="space-y-4 p-4 rounded-lg bg-secondary/50">
              <Label className="text-base">Типы уведомлений</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="daily-reminder" className="text-sm">
                      Напоминания о дневном плане
                    </Label>
                  </div>
                  <Switch
                    id="daily-reminder"
                    checked={settings.daily_reminder_enabled}
                    onCheckedChange={(checked) => handleToggle("daily_reminder_enabled", checked)}
                    disabled={!settings.enabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="motivation" className="text-sm">
                      Мотивация при отставании
                    </Label>
                  </div>
                  <Switch
                    id="motivation"
                    checked={settings.motivation_enabled}
                    onCheckedChange={(checked) => handleToggle("motivation_enabled", checked)}
                    disabled={!settings.enabled}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="badge-notifications" className="text-sm">
                      Поздравления с бейджами
                    </Label>
                  </div>
                  <Switch
                    id="badge-notifications"
                    checked={settings.badge_notifications_enabled}
                    onCheckedChange={(checked) => handleToggle("badge_notifications_enabled", checked)}
                    disabled={!settings.enabled}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Тестовое уведомление */}
          {settings.enabled && (
            <Button onClick={sendTestNotification} variant="outline" className="w-full">
              <Bell className="w-4 h-4 mr-2" />
              Отправить тестовое уведомление
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Примеры уведомлений */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Примеры уведомлений</CardTitle>
          <CardDescription>
            Как будут выглядеть ваши уведомления
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Напоминание о дневном плане */}
          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">Напоминание о дневном плане</p>
                <p className="text-sm text-muted-foreground">
                  Ахмад – у тебя цель "5000 салаватов", осталось 3 намаза для выполнения дневного плана
                </p>
              </div>
            </div>
          </div>

          {/* Мотивация при отставании */}
          <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">Мотивация при отставании</p>
                <p className="text-sm text-muted-foreground">
                  Ахмад – вы отстаете от графика. Чтобы достичь цель "5000 салаватов", осталось 15 дней. Нужно делать 50 салаватов в день
                </p>
              </div>
            </div>
          </div>

          {/* Поздравление с бейджем */}
          <div className="p-4 rounded-lg border bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">Поздравление с бейджем</p>
                <p className="text-sm text-muted-foreground">
                  Ахмад – поздравляем! Вы получили бейдж "Неуклонный в намазе" (30 дней без пропусков) 🎉
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* История уведомлений */}
      {notifications.length > 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>История уведомлений</CardTitle>
            <CardDescription>
              Последние отправленные уведомления
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 rounded-lg border bg-background"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.personalized_message}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {notification.type}
                    </Badge>
                  </div>
                  {notification.sent_at && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.sent_at).toLocaleString("ru-RU")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

