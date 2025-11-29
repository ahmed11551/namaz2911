import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PrayerProgressCardProps {
  name: string;
  completed: number;
  total: number;
  color: string;
  emoji: string;
}

export const PrayerProgressCard = memo(({
  name,
  completed,
  total,
  color,
  emoji,
}: PrayerProgressCardProps) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card className="bg-gradient-card hover:shadow-medium transition-shadow duration-300 border-border/50">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{emoji}</span>
              <h3 className="font-semibold text-foreground">{name}</h3>
            </div>
            <div className="text-sm font-bold gradient-text">
              {percentage}%
            </div>
          </div>
          
          <Progress 
            value={percentage} 
            className="h-2"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completed.toLocaleString()}</span>
            <span>{total.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

PrayerProgressCard.displayName = "PrayerProgressCard";
