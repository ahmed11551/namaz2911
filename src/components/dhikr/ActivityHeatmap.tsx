// Компонент тепловой карты активности по часам дня
// Отображает активность пользователя в течение дня (24 часа)

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp } from "lucide-react";

interface ActivityHeatmapProps {
  hourlyActivity: number[];
  maxActivity: number;
  timezone?: string;
  className?: string;
}

export const ActivityHeatmap = ({
  hourlyActivity,
  maxActivity,
  timezone = "UTC",
  className,
}: ActivityHeatmapProps) => {
  // Группируем часы по периодам дня для лучшей визуализации
  const periods = useMemo(() => {
    return [
      { label: "Ночь", hours: [0, 1, 2, 3, 4, 5], color: "bg-slate-800" },
      { label: "Утро", hours: [6, 7, 8, 9, 10, 11], color: "bg-blue-600" },
      { label: "День", hours: [12, 13, 14, 15, 16, 17], color: "bg-amber-500" },
      { label: "Вечер", hours: [18, 19, 20, 21, 22, 23], color: "bg-purple-600" },
    ];
  }, []);

  // Вычисляем активность по периодам
  const periodStats = useMemo(() => {
    return periods.map((period) => {
      const periodActivity = period.hours.reduce(
        (sum, hour) => sum + (hourlyActivity[hour] || 0),
        0
      );
      return {
        ...period,
        activity: periodActivity,
        percentage: maxActivity > 0 ? (periodActivity / maxActivity) * 100 : 0,
      };
    });
  }, [hourlyActivity, maxActivity, periods]);

  // Получаем цвет интенсивности для часа
  const getIntensityColor = (value: number): string => {
    if (value === 0) return "bg-muted";
    
    const intensity = maxActivity > 0 ? value / maxActivity : 0;
    
    if (intensity >= 0.8) return "bg-primary";
    if (intensity >= 0.6) return "bg-primary/80";
    if (intensity >= 0.4) return "bg-primary/60";
    if (intensity >= 0.2) return "bg-primary/40";
    return "bg-primary/20";
  };

  // Форматируем час для отображения
  const formatHour = (hour: number): string => {
    return `${hour.toString().padStart(2, "0")}:00`;
  };

  // Находим пиковые часы
  const peakHours = useMemo(() => {
    const maxValue = Math.max(...hourlyActivity);
    return hourlyActivity
      .map((value, hour) => ({ hour, value }))
      .filter((item) => item.value === maxValue && item.value > 0)
      .map((item) => item.hour);
  }, [hourlyActivity]);

  const totalActivity = hourlyActivity.reduce((sum, val) => sum + val, 0);

  return (
    <Card className={cn("bg-gradient-card border-border/50", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-primary" />
              Тепловая карта активности
            </CardTitle>
            <CardDescription>
              Активность по часам дня ({timezone})
            </CardDescription>
          </div>
          {totalActivity > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{totalActivity}</div>
              <div className="text-xs text-muted-foreground">всего зикров</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Основная тепловая карта по часам */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Активность по часам</span>
            {peakHours.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Пик: {peakHours.map((h) => formatHour(h)).join(", ")}
              </span>
            )}
          </div>
          <div className="grid grid-cols-12 gap-1">
            {hourlyActivity.map((value, hour) => (
              <div
                key={hour}
                className="flex flex-col items-center gap-1"
                title={`${formatHour(hour)}: ${value} зикров`}
              >
                <div
                  className={cn(
                    "w-full rounded transition-all hover:scale-110 cursor-pointer",
                    getIntensityColor(value),
                    value === 0 && "opacity-30"
                  )}
                  style={{ height: `${Math.max((value / maxActivity) * 40, 4)}px` }}
                />
                {hour % 3 === 0 && (
                  <span className="text-[8px] text-muted-foreground">
                    {formatHour(hour).split(":")[0]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Статистика по периодам дня */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Активность по периодам</span>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {periodStats.map((period) => (
              <div
                key={period.label}
                className="rounded-lg border border-border/50 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{period.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {period.activity} зикров
                  </span>
                </div>
                <div className="space-y-1">
                  <HeatmapProgress
                    value={period.percentage}
                    className="h-2"
                    style={{
                      backgroundColor: "var(--muted)",
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <div
                      className={cn("w-3 h-3 rounded", period.color)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {period.hours.map((h) => formatHour(h).split(":")[0]).join(", ")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Легенда */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <span>Меньше</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/20" />
            <div className="w-3 h-3 rounded bg-primary/40" />
            <div className="w-3 h-3 rounded bg-primary/60" />
            <div className="w-3 h-3 rounded bg-primary/80" />
            <div className="w-3 h-3 rounded bg-primary" />
          </div>
          <span>Больше</span>
        </div>
      </CardContent>
    </Card>
  );
};

// Компонент Progress для отображения прогресса
const HeatmapProgress = ({
  value,
  className,
  style,
}: {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full", className)}
      style={style}
    >
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
};

