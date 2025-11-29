// Настройки уведомлений о намазах
import { useState, useEffect } from "react";
import { 
  Bell, 
  BellOff, 
  Clock, 
  Volume2, 
  Vibrate,
  CheckCircle,
  AlertCircle,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  ChevronRight,
  Settings,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  getNotificationPermission,
  sendTestNotification,
  notificationManager,
  type PrayerNotificationSettings,
} from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";

interface PrayerToggleProps {
  prayerKey: string;
  name: string;
  nameAr: string;
  icon: React.ElementType;
  gradient: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const PrayerToggle = ({ 
  prayerKey, 
  name, 
  nameAr, 
  icon: Icon, 
  gradient, 
  enabled, 
  onToggle 
}: PrayerToggleProps) => {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-xl transition-all",
      enabled ? "bg-primary/10" : "bg-secondary/50"
    )}>
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center",
        enabled ? `bg-gradient-to-br ${gradient}` : "bg-secondary"
      )}>
        <Icon className={cn("w-6 h-6", enabled ? "text-white" : "text-muted-foreground")} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("font-semibold", enabled ? "text-foreground" : "text-muted-foreground")}>
            {name}
          </p>
          <span className="text-xs text-muted-foreground">{nameAr}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {enabled ? "Уведомление включено" : "Уведомление выключено"}
        </p>
      </div>
      <Switch 
        checked={enabled} 
        onCheckedChange={onToggle}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  );
};

const PRAYERS = [
  { key: "fajr", name: "Фаджр", nameAr: "الفجر", icon: Moon, gradient: "from-indigo-500 to-purple-600" },
  { key: "dhuhr", name: "Зухр", nameAr: "الظهر", icon: Sun, gradient: "from-yellow-400 to-orange-500" },
  { key: "asr", name: "Аср", nameAr: "العصر", icon: Sun, gradient: "from-amber-500 to-orange-600" },
  { key: "maghrib", name: "Магриб", nameAr: "المغرب", icon: Sunset, gradient: "from-rose-500 to-purple-600" },
  { key: "isha", name: "Иша", nameAr: "العشاء", icon: Moon, gradient: "from-violet-600 to-indigo-700" },
];

const REMINDER_OPTIONS = [
  { value: 5, label: "5 минут" },
  { value: 10, label: "10 минут" },
  { value: 15, label: "15 минут" },
  { value: 30, label: "30 минут" },
  { value: 60, label: "1 час" },
];

interface NotificationSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationSettings = ({ open, onOpenChange }: NotificationSettingsProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PrayerNotificationSettings>(getNotificationSettings());
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, [open]);

  const handleToggleAll = async (enabled: boolean) => {
    if (enabled && permission !== "granted") {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast({
          title: "Уведомления заблокированы",
          description: "Разрешите уведомления в настройках браузера",
          variant: "destructive",
        });
        return;
      }
      setPermission("granted");
    }

    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    notificationManager.updateSettings(newSettings);
  };

  const handleTogglePrayer = (prayerKey: string, enabled: boolean) => {
    const newSettings = { ...settings, [prayerKey]: enabled };
    setSettings(newSettings);
    notificationManager.updateSettings(newSettings);
  };

  const handleChangeReminderTime = (minutes: number) => {
    const newSettings = { ...settings, minutesBefore: minutes };
    setSettings(newSettings);
    notificationManager.updateSettings(newSettings);
  };

  const handleToggleSound = (enabled: boolean) => {
    const newSettings = { ...settings, sound: enabled };
    setSettings(newSettings);
    notificationManager.updateSettings(newSettings);
  };

  const handleToggleVibrate = (enabled: boolean) => {
    const newSettings = { ...settings, vibrate: enabled };
    setSettings(newSettings);
    notificationManager.updateSettings(newSettings);
  };

  const handleSendTest = async () => {
    setIsSending(true);
    const success = await sendTestNotification();
    setIsSending(false);

    if (success) {
      toast({
        title: "✅ Тестовое уведомление отправлено",
        description: "Проверьте уведомления на вашем устройстве",
      });
    } else {
      toast({
        title: "Не удалось отправить",
        description: "Разрешите уведомления в настройках браузера",
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl bg-card border-t border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Уведомления о намазах
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-8">
          {/* Permission Status */}
          {permission === "unsupported" ? (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Уведомления не поддерживаются</p>
                <p className="text-sm text-muted-foreground">
                  Ваш браузер не поддерживает push-уведомления
                </p>
              </div>
            </div>
          ) : permission === "denied" ? (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-500">Уведомления заблокированы</p>
                <p className="text-sm text-muted-foreground">
                  Разрешите уведомления в настройках браузера, чтобы получать напоминания о намазах
                </p>
              </div>
            </div>
          ) : permission === "granted" && settings.enabled ? (
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-primary">Уведомления активны</p>
                <p className="text-sm text-muted-foreground">
                  Вы будете получать напоминания о намазах
                </p>
              </div>
            </div>
          ) : null}

          {/* Main Toggle */}
          <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                settings.enabled ? "bg-primary" : "bg-muted"
              )}>
                {settings.enabled ? (
                  <Bell className="w-6 h-6 text-primary-foreground" />
                ) : (
                  <BellOff className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {settings.enabled ? "Уведомления включены" : "Уведомления выключены"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Напоминания о времени намаза
                </p>
              </div>
            </div>
            <Switch 
              checked={settings.enabled} 
              onCheckedChange={handleToggleAll}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {settings.enabled && permission === "granted" && (
            <>
              {/* Reminder Time */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Напоминать за
                </h3>
                <div className="flex flex-wrap gap-2">
                  {REMINDER_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleChangeReminderTime(option.value)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                        settings.minutesBefore === option.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prayer Toggles */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Выберите намазы
                </h3>
                <div className="space-y-2">
                  {PRAYERS.map(prayer => (
                    <PrayerToggle
                      key={prayer.key}
                      prayerKey={prayer.key}
                      name={prayer.name}
                      nameAr={prayer.nameAr}
                      icon={prayer.icon}
                      gradient={prayer.gradient}
                      enabled={settings[prayer.key as keyof PrayerNotificationSettings] as boolean}
                      onToggle={(enabled) => handleTogglePrayer(prayer.key, enabled)}
                    />
                  ))}
                </div>
              </div>

              {/* Sound & Vibration */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Дополнительно
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">Звук уведомления</span>
                    </div>
                    <Switch 
                      checked={settings.sound} 
                      onCheckedChange={handleToggleSound}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Vibrate className="w-5 h-5 text-muted-foreground" />
                      <span className="font-medium text-foreground">Вибрация</span>
                    </div>
                    <Switch 
                      checked={settings.vibrate} 
                      onCheckedChange={handleToggleVibrate}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Test Button */}
              <button
                onClick={handleSendTest}
                disabled={isSending}
                className="w-full flex items-center justify-center gap-2 p-4 bg-primary/10 hover:bg-primary/20 rounded-xl text-primary font-medium transition-colors disabled:opacity-50"
              >
                <Send className={cn("w-5 h-5", isSending && "animate-pulse")} />
                {isSending ? "Отправка..." : "Отправить тестовое уведомление"}
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Виджет для быстрого включения уведомлений
export const NotificationQuickToggle = () => {
  const [settings, setSettings] = useState<PrayerNotificationSettings>(getNotificationSettings());
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
    setSettings(getNotificationSettings());
  }, []);

  const handleToggle = async () => {
    if (!settings.enabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        const newSettings = { ...settings, enabled: true };
        setSettings(newSettings);
        notificationManager.updateSettings(newSettings);
        setPermission("granted");
      }
    } else {
      const newSettings = { ...settings, enabled: false };
      setSettings(newSettings);
      notificationManager.updateSettings(newSettings);
    }
  };

  if (permission === "unsupported") {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowSettings(true)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl transition-colors",
          settings.enabled && permission === "granted"
            ? "bg-primary/20 text-primary"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        )}
      >
        {settings.enabled && permission === "granted" ? (
          <Bell className="w-4 h-4" />
        ) : (
          <BellOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {settings.enabled && permission === "granted" ? "Уведомления вкл" : "Уведомления"}
        </span>
        <ChevronRight className="w-4 h-4" />
      </button>

      <NotificationSettings open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
};

