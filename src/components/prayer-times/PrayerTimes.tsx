// Компонент расписания намазов с геолокацией
// Адаптация идей с azan.ru, но с уникальным дизайном

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  MapPin,
  Navigation,
  Bell,
  Calendar,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, addDays, differenceInMinutes, isAfter, isBefore } from "date-fns";
import { ru } from "date-fns/locale/ru";

interface PrayerTime {
  name: string;
  time: Date;
  arabic: string;
  emoji: string;
  color: string;
}

interface PrayerTimesProps {
  onPrayerCompleted?: (prayerName: string) => void;
}

// Временные данные (в реальности будут из API)
const MOCK_PRAYER_TIMES: PrayerTime[] = [
  {
    name: "Фаджр",
    time: new Date(new Date().setHours(5, 30)),
    arabic: "الفجر",
    emoji: "🌅",
    color: "text-blue-600",
  },
  {
    name: "Зухр",
    time: new Date(new Date().setHours(12, 45)),
    arabic: "الظهر",
    emoji: "☀️",
    color: "text-yellow-600",
  },
  {
    name: "Аср",
    time: new Date(new Date().setHours(15, 20)),
    arabic: "العصر",
    emoji: "🌤️",
    color: "text-orange-600",
  },
  {
    name: "Магриб",
    time: new Date(new Date().setHours(18, 10)),
    arabic: "المغرب",
    emoji: "🌇",
    color: "text-red-600",
  },
  {
    name: "Иша",
    time: new Date(new Date().setHours(19, 45)),
    arabic: "العشاء",
    emoji: "🌙",
    color: "text-purple-600",
  },
];

export const PrayerTimes = ({ onPrayerCompleted }: PrayerTimesProps) => {
  const { toast } = useToast();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [city, setCity] = useState<string>("Москва");
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>(MOCK_PRAYER_TIMES);
  const [completedPrayers, setCompletedPrayers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Получение геолокации
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          // TODO: Определить город по координатам
        },
        (error) => {
          console.warn("Геолокация недоступна:", error);
        }
      );
    }
  }, []);

  // Загрузка расписания намазов
  useEffect(() => {
    loadPrayerTimes();
  }, [city, location]);

  const loadPrayerTimes = async () => {
    setLoading(true);
    try {
      // TODO: Интеграция с API для получения времени намазов
      // const times = await prayerTimesAPI.getTimes(city, location);
      // setPrayerTimes(times);
      
      // Пока используем мок-данные
      const now = new Date();
      const updatedTimes = MOCK_PRAYER_TIMES.map((prayer) => ({
        ...prayer,
        time: new Date(now.setHours(
          prayer.time.getHours(),
          prayer.time.getMinutes()
        )),
      }));
      setPrayerTimes(updatedTimes);
    } catch (error) {
      console.error("Error loading prayer times:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить расписание намазов",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Определение следующего намаза
  const nextPrayer = useMemo(() => {
    const now = new Date();
    const upcoming = prayerTimes
      .filter((p) => isAfter(p.time, now))
      .sort((a, b) => a.time.getTime() - b.time.getTime())[0];
    
    if (!upcoming) {
      // Если все намазы прошли, следующий - Фаджр завтра
      const tomorrowFajr = new Date(prayerTimes[0].time);
      tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
      return { ...prayerTimes[0], time: tomorrowFajr };
    }
    
    return upcoming;
  }, [prayerTimes]);

  // Время до следующего намаза
  const timeUntilNext = useMemo(() => {
    if (!nextPrayer) return null;
    const now = new Date();
    const diff = differenceInMinutes(nextPrayer.time, now);
    
    if (diff < 0) return null;
    
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    return { hours, minutes, total: diff };
  }, [nextPrayer]);

  // Прогресс до следующего намаза (для визуализации)
  const progressToNext = useMemo(() => {
    if (!nextPrayer || !timeUntilNext) return 0;
    
    // Находим предыдущий намаз
    const currentIndex = prayerTimes.findIndex((p) => p.name === nextPrayer.name);
    const prevPrayer = currentIndex > 0 
      ? prayerTimes[currentIndex - 1] 
      : prayerTimes[prayerTimes.length - 1];
    
    const totalMinutes = differenceInMinutes(nextPrayer.time, prevPrayer.time);
    const elapsed = totalMinutes - timeUntilNext.total;
    
    return Math.max(0, Math.min(100, (elapsed / totalMinutes) * 100));
  }, [nextPrayer, timeUntilNext, prayerTimes]);

  const handlePrayerComplete = (prayerName: string) => {
    setCompletedPrayers((prev) => new Set([...prev, prayerName]));
    onPrayerCompleted?.(prayerName);
    toast({
      title: "Намаз выполнен",
      description: `${prayerName} отмечен как выполненный`,
    });
  };

  const isPrayerPassed = (prayer: PrayerTime) => {
    return isBefore(prayer.time, new Date());
  };

  const isPrayerUpcoming = (prayer: PrayerTime) => {
    return prayer.name === nextPrayer?.name;
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            Расписание намазов
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Точное время намазов для вашего местоположения
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="w-4 h-4 mr-2" />
          Календарь
        </Button>
      </div>

      {/* Виджет следующего намаза */}
      {nextPrayer && timeUntilNext && (
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Следующий намаз
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{nextPrayer.emoji}</div>
                  <div>
                    <p className="text-xl font-bold">{nextPrayer.name}</p>
                    <p className="text-sm text-muted-foreground">{nextPrayer.arabic}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {format(nextPrayer.time, "HH:mm")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {timeUntilNext.hours > 0 
                      ? `${timeUntilNext.hours} ч ${timeUntilNext.minutes} мин`
                      : `${timeUntilNext.minutes} мин`}
                  </p>
                </div>
              </div>
              <Progress value={progressToNext} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Настройка местоположения */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Местоположение
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="city">Город</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger id="city" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Москва">Москва</SelectItem>
                  <SelectItem value="Санкт-Петербург">Санкт-Петербург</SelectItem>
                  <SelectItem value="Казань">Казань</SelectItem>
                  <SelectItem value="Уфа">Уфа</SelectItem>
                  <SelectItem value="Махачкала">Махачкала</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {location && (
              <div className="text-sm text-muted-foreground">
                Координаты: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                      });
                      toast({
                        title: "Местоположение обновлено",
                        description: "Расписание пересчитано",
                      });
                    },
                    (error) => {
                      toast({
                        title: "Ошибка",
                        description: "Не удалось определить местоположение",
                        variant: "destructive",
                      });
                    }
                  );
                }
              }}
            >
              <Navigation className="w-4 h-4 mr-2" />
              Определить автоматически
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Список намазов */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Сегодня</CardTitle>
          <CardDescription>
            {format(new Date(), "d MMMM yyyy", { locale: ru })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {prayerTimes.map((prayer) => {
              const isPassed = isPrayerPassed(prayer);
              const isUpcoming = isPrayerUpcoming(prayer);
              const isCompleted = completedPrayers.has(prayer.name);

              return (
                <div
                  key={prayer.name}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    isUpcoming && "bg-primary/10 border-primary/50 shadow-md",
                    isPassed && !isCompleted && "bg-muted/50 border-muted",
                    isCompleted && "bg-green-50 border-green-200"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">{prayer.emoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{prayer.name}</p>
                          {isUpcoming && (
                            <Badge variant="default" className="text-xs">
                              Следующий
                            </Badge>
                          )}
                          {isCompleted && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{prayer.arabic}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={cn(
                          "text-lg font-bold",
                          isUpcoming && prayer.color,
                          isPassed && !isCompleted && "text-muted-foreground",
                          isCompleted && "text-green-600"
                        )}>
                          {format(prayer.time, "HH:mm")}
                        </p>
                        {isPassed && !isCompleted && (
                          <p className="text-xs text-muted-foreground">Пропущен</p>
                        )}
                      </div>
                      {isPassed && !isCompleted && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrayerComplete(prayer.name)}
                        >
                          Отметить
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Статистика дня */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Статистика дня
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Выполнено намазов</span>
              <span className="font-semibold">
                {completedPrayers.size} из {prayerTimes.length}
              </span>
            </div>
            <Progress
              value={(completedPrayers.size / prayerTimes.length) * 100}
              className="h-2"
            />
            {completedPrayers.size === prayerTimes.length && (
              <p className="text-sm text-green-600 font-semibold text-center mt-2">
                ✨ Отличный день! Все намазы выполнены
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

