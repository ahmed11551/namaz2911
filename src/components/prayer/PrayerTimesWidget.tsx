// Виджет времени намазов - стиль Fintrack
import { useState, useEffect, useMemo } from "react";
import { 
  Sun, 
  Sunrise, 
  Sunset, 
  Moon, 
  Clock,
  MapPin,
  ChevronRight,
  Bell,
  BellRing,
  Check,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationSettings, NotificationQuickToggle } from "./NotificationSettings";
import { CitySelector, useCitySelection } from "./CitySelector";
import { getNotificationSettings, notificationManager } from "@/lib/notifications";

interface PrayerTime {
  name: string;
  nameAr: string;
  time: string;
  icon: React.ElementType;
  gradient: string;
  passed: boolean;
  current: boolean;
}

// Расчёт времени намазов (упрощённый алгоритм)
const calculatePrayerTimes = (date: Date = new Date()): PrayerTime[] => {
  // Базовые времена (для демо, потом можно подключить API)
  const baseHours = {
    fajr: 5,
    sunrise: 7,
    dhuhr: 12,
    asr: 15,
    maghrib: 18,
    isha: 20,
  };

  // Корректировка по времени года (упрощённая)
  const month = date.getMonth();
  const summerOffset = month >= 4 && month <= 8 ? 1 : 0;
  const winterOffset = month >= 10 || month <= 2 ? -1 : 0;
  const offset = summerOffset + winterOffset;

  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const prayers: PrayerTime[] = [
    {
      name: "Фаджр",
      nameAr: "الفجر",
      time: `${String(baseHours.fajr + offset).padStart(2, "0")}:30`,
      icon: Moon,
      gradient: "from-indigo-500 to-purple-600",
      passed: false,
      current: false,
    },
    {
      name: "Восход",
      nameAr: "الشروق",
      time: `${String(baseHours.sunrise + offset).padStart(2, "0")}:00`,
      icon: Sunrise,
      gradient: "from-orange-400 to-pink-500",
      passed: false,
      current: false,
    },
    {
      name: "Зухр",
      nameAr: "الظهر",
      time: `${String(baseHours.dhuhr).padStart(2, "0")}:30`,
      icon: Sun,
      gradient: "from-yellow-400 to-orange-500",
      passed: false,
      current: false,
    },
    {
      name: "Аср",
      nameAr: "العصر",
      time: `${String(baseHours.asr + offset).padStart(2, "0")}:45`,
      icon: Sun,
      gradient: "from-amber-500 to-orange-600",
      passed: false,
      current: false,
    },
    {
      name: "Магриб",
      nameAr: "المغرب",
      time: `${String(baseHours.maghrib + offset).padStart(2, "0")}:15`,
      icon: Sunset,
      gradient: "from-rose-500 to-purple-600",
      passed: false,
      current: false,
    },
    {
      name: "Иша",
      nameAr: "العشاء",
      time: `${String(baseHours.isha + offset).padStart(2, "0")}:00`,
      icon: Moon,
      gradient: "from-violet-600 to-indigo-700",
      passed: false,
      current: false,
    },
  ];

  // Определяем прошедшие и текущий намаз
  let foundCurrent = false;
  prayers.forEach((prayer, index) => {
    const [hours, minutes] = prayer.time.split(":").map(Number);
    const prayerTime = hours * 60 + minutes;
    
    if (prayerTime < currentTime) {
      prayer.passed = true;
    } else if (!foundCurrent) {
      prayer.current = true;
      foundCurrent = true;
    }
  });

  // Если все намазы прошли, текущий - Фаджр следующего дня
  if (!foundCurrent && prayers.every(p => p.passed)) {
    prayers[0].current = true;
    prayers[0].passed = false;
  }

  return prayers;
};

// Расчёт времени до следующего намаза
const getTimeUntilNext = (prayers: PrayerTime[]): string => {
  const current = prayers.find(p => p.current);
  if (!current) return "";

  const now = new Date();
  const [hours, minutes] = current.time.split(":").map(Number);
  
  let targetDate = new Date(now);
  targetDate.setHours(hours, minutes, 0, 0);
  
  // Если время уже прошло сегодня, значит это на следующий день
  if (targetDate < now) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  const diff = targetDate.getTime() - now.getTime();
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 0) {
    return `${diffHours}ч ${diffMinutes}м`;
  }
  return `${diffMinutes} мин`;
};

interface PrayerTimesWidgetProps {
  compact?: boolean;
}

export const PrayerTimesWidget = ({ compact = false }: PrayerTimesWidgetProps) => {
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const { city, cityName, isOpen, setIsOpen, handleCityChange } = useCitySelection();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const settings = getNotificationSettings();
    setNotificationsEnabled(settings.enabled);
  }, [showNotificationSettings]);

  useEffect(() => {
    setPrayers(calculatePrayerTimes());
    
    // Обновляем каждую минуту
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setPrayers(calculatePrayerTimes());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const currentPrayer = prayers.find(p => p.current);
  const timeUntilNext = useMemo(() => getTimeUntilNext(prayers), [prayers, currentTime]);

  if (compact) {
    // Компактная версия для главной страницы
    return (
      <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-medium slide-up">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Время намаза</h3>
              <button 
                onClick={() => setIsOpen(true)}
                className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
              >
                <MapPin className="w-3 h-3" />
                {cityName}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowNotificationSettings(true)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                notificationsEnabled 
                  ? "bg-primary/20 text-primary" 
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {notificationsEnabled ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </button>
            <button 
              onClick={() => setIsOpen(true)}
              className="text-primary text-xs font-medium"
            >
              Изменить
            </button>
          </div>
        </div>

        {/* City Selector */}
        <CitySelector 
          selectedCity={cityName}
          onCityChange={handleCityChange}
          open={isOpen}
          onOpenChange={setIsOpen}
        />

        {/* Notification Settings */}
        <NotificationSettings 
          open={showNotificationSettings} 
          onOpenChange={setShowNotificationSettings} 
        />

        {currentPrayer && (
          <div className={cn(
            "rounded-xl p-4 mb-3",
            `bg-gradient-to-r ${currentPrayer.gradient}`
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <currentPrayer.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-xs">Следующий</p>
                  <p className="text-white font-bold text-lg">{currentPrayer.name}</p>
                  <p className="text-white/80 text-sm">{currentPrayer.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs">Через</p>
                <p className="text-white font-bold text-xl">{timeUntilNext}</p>
              </div>
            </div>
          </div>
        )}

        {/* Мини-расписание */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {prayers.map((prayer, i) => (
            <div
              key={prayer.name}
              className={cn(
                "flex-shrink-0 px-3 py-2 rounded-xl text-center min-w-[60px] transition-all",
                prayer.current 
                  ? "bg-primary text-primary-foreground" 
                  : prayer.passed 
                    ? "bg-secondary/50 text-muted-foreground" 
                    : "bg-secondary text-foreground"
              )}
            >
              <prayer.icon className={cn(
                "w-4 h-4 mx-auto mb-1",
                prayer.current ? "text-primary-foreground" : prayer.passed ? "text-muted-foreground" : "text-foreground"
              )} />
              <p className="text-[10px] font-medium">{prayer.name}</p>
              <p className="text-[10px] opacity-70">{prayer.time}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Полная версия
  return (
    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-medium">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center subtle-float">
            <Clock className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Время намазов</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {city}
            </p>
          </div>
        </div>
        <button className="px-3 py-1.5 bg-secondary rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-4 h-4" />
        </button>
      </div>

      {/* Current Prayer Highlight */}
      {currentPrayer && (
        <div className={cn(
          "rounded-2xl p-5 mb-4 relative overflow-hidden",
          `bg-gradient-to-r ${currentPrayer.gradient}`
        )}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center subtle-float">
                <currentPrayer.icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-white/70 text-sm">Следующий намаз</p>
                <p className="text-white font-bold text-2xl">{currentPrayer.name}</p>
                <p className="text-white/80 text-lg">{currentPrayer.time}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Осталось</p>
              <p className="text-white font-bold text-3xl">{timeUntilNext}</p>
            </div>
          </div>
        </div>
      )}

      {/* All Prayers List */}
      <div className="space-y-2">
        {prayers.map((prayer, i) => (
          <div
            key={prayer.name}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all",
              prayer.current 
                ? "bg-primary/10 border border-primary/30" 
                : prayer.passed 
                  ? "opacity-50" 
                  : "bg-secondary/50 hover:bg-secondary"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              prayer.current 
                ? `bg-gradient-to-br ${prayer.gradient}` 
                : "bg-secondary"
            )}>
              <prayer.icon className={cn(
                "w-5 h-5",
                prayer.current ? "text-white" : "text-muted-foreground"
              )} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className={cn(
                  "font-semibold",
                  prayer.current ? "text-primary" : "text-foreground"
                )}>
                  {prayer.name}
                </p>
                <p className="text-xs text-muted-foreground">{prayer.nameAr}</p>
              </div>
            </div>
            
            <p className={cn(
              "font-mono font-semibold",
              prayer.current ? "text-primary" : "text-foreground"
            )}>
              {prayer.time}
            </p>
            
            {prayer.passed && (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Мини-виджет для хедера
export const PrayerTimesMini = () => {
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [timeUntilNext, setTimeUntilNext] = useState("");

  useEffect(() => {
    const update = () => {
      const p = calculatePrayerTimes();
      setPrayers(p);
      setTimeUntilNext(getTimeUntilNext(p));
    };
    
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentPrayer = prayers.find(p => p.current);
  if (!currentPrayer) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-lg">
      <currentPrayer.icon className="w-4 h-4 text-primary" />
      <span className="text-xs font-medium text-foreground">{currentPrayer.name}</span>
      <span className="text-xs text-muted-foreground">{currentPrayer.time}</span>
    </div>
  );
};

