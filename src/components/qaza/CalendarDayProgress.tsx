// Компонент прогресс-кольца для дня в календаре

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface CalendarDayProgressProps {
  total: number;
  dailyGoal?: number; // Целевое количество намазов в день
  size?: number; // Размер кольца в пикселях
  className?: string;
}

export const CalendarDayProgress = ({
  total,
  dailyGoal = 10,
  size = 36,
  className,
}: CalendarDayProgressProps) => {
  // Определяем цвет на основе интенсивности
  const intensity = useMemo(() => {
    if (total === 0) return "none";
    if (total >= dailyGoal * 1.5) return "high"; // Зеленый - много
    if (total >= dailyGoal * 0.7) return "medium"; // Желтый - среднее
    return "low"; // Красный - мало
  }, [total, dailyGoal]);

  // Процент заполнения (максимум 100%)
  const progress = useMemo(() => {
    if (total === 0) return 0;
    // Если превысили цель в 1.5 раза, показываем 100%
    const maxValue = dailyGoal * 1.5;
    return Math.min(100, Math.round((total / maxValue) * 100));
  }, [total, dailyGoal]);

  // Цвета для разных уровней интенсивности
  const colors = {
    none: "stroke-muted-foreground/30 fill-muted-foreground/10",
    low: "stroke-red-500 fill-red-50",
    medium: "stroke-yellow-500 fill-yellow-50",
    high: "stroke-green-500 fill-green-50",
  };

  const strokeColor = {
    none: "#e5e7eb",
    low: "#ef4444",
    medium: "#eab308",
    high: "#22c55e",
  };

  const center = size / 2;
  const radius = (size - 8) / 2; // Отступ от края
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Фоновое кольцо */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={strokeColor.none}
          strokeWidth="2"
          className="opacity-30"
        />
        {/* Прогресс-кольцо */}
        {total > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={strokeColor[intensity]}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300"
            style={{
              filter: intensity === "high" ? "drop-shadow(0 0 2px rgba(34, 197, 94, 0.5))" : undefined,
            }}
          />
        )}
      </svg>
      {/* Число в центре */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            "text-[10px] font-bold leading-none",
            total === 0 && "text-muted-foreground/50",
            intensity === "high" && "text-green-700",
            intensity === "medium" && "text-yellow-700",
            intensity === "low" && total > 0 && "text-red-700"
          )}
        >
          {total > 0 ? total : ""}
        </span>
      </div>
    </div>
  );
};

