import { useState, memo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { spiritualPathAPI } from "@/lib/api";

interface AdhkarCardProps {
  dhikr: {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    text: string;
    transcription: string;
    russianTranscription?: string;
    translation: string;
    count: number;
    category: string;
  };
}

export const AdhkarCard = memo(({ dhikr }: AdhkarCardProps) => {
  const [currentCount, setCurrentCount] = useState(0);

  // Определяем тип счетчика для синхронизации с целями
  const getCounterType = (): string | null => {
    const title = dhikr.title.toLowerCase();
    if (title.includes("тасбих") || title.includes("субханаллах")) return "tasbih";
    if (title.includes("тахмид") || title.includes("альхамдулиллах")) return "tahmid";
    if (title.includes("такбир") || title.includes("аллаху акбар")) return "takbir";
    if (title.includes("салават") || title.includes("салават")) return "salawat";
    return null;
  };

  const handleClick = async () => {
    if (currentCount < dhikr.count) {
      const newCount = currentCount + 1;
      setCurrentCount(newCount);
      
      // Синхронизация с целями при достижении полного счета
      if (newCount === dhikr.count) {
        const counterType = getCounterType();
        if (counterType) {
          try {
            await spiritualPathAPI.syncCounter(counterType, 1);
          } catch (error) {
            console.error("Error syncing counter with goals:", error);
            // Не показываем ошибку пользователю, чтобы не мешать использованию тасбиха
          }
        }
      }
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentCount(0);
  };

  const progress = (currentCount / dhikr.count) * 100;
  const isComplete = currentCount === dhikr.count;

  return (
    <Card
      className={cn(
        "glass shadow-medium border-border/50 cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-strong",
        isComplete && "shadow-glow border-primary/50"
      )}
      onClick={handleClick}
    >
      <div
        className={cn(
          "h-1 bg-gradient-to-r transition-all duration-500",
          isComplete ? "from-primary to-accent" : "from-muted to-transparent"
        )}
        style={{ width: `${progress}%` }}
      />
      <CardContent className="pt-6 space-y-4">
        {/* Icon and Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <dhikr.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{dhikr.title}</h3>
              <p className="text-xs text-muted-foreground">{dhikr.category}</p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleReset}
            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Arabic Text */}
        <div className="text-center py-4">
          <p className="text-4xl font-arabic text-foreground" style={{ fontFamily: "'Amiri', serif" }}>
            {dhikr.text}
          </p>
        </div>

        {/* Transcription */}
        <div className="space-y-3">
          {/* Latin Transcription */}
          <div className="bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-xl p-4 border border-border/40 shadow-inner backdrop-blur-sm">
            <p className="text-center text-sm sm:text-base text-foreground/95 italic leading-relaxed">
              {dhikr.transcription}
            </p>
          </div>
          
          {/* Russian Transcription */}
          {dhikr.russianTranscription && (
            <div className="bg-gradient-to-br from-accent/15 to-accent/5 rounded-xl p-4 border border-accent/30 shadow-inner backdrop-blur-sm">
              <p className="text-center text-sm sm:text-base text-foreground/95 leading-relaxed font-medium">
                {dhikr.russianTranscription}
              </p>
            </div>
          )}
          
          {/* Translation */}
          <div className="bg-gradient-to-br from-primary/8 to-primary/3 rounded-xl p-4 border border-primary/25 shadow-inner backdrop-blur-sm">
            <p className="text-center text-sm sm:text-base text-foreground leading-relaxed">
              {dhikr.translation}
            </p>
          </div>
        </div>

        {/* Counter */}
        <div className="text-center">
          <div
            className={cn(
              "inline-flex items-center justify-center w-20 h-20 rounded-full border-4 transition-all duration-300",
              isComplete
                ? "border-primary bg-primary/10 shadow-glow"
                : "border-border/30 bg-secondary/30"
            )}
          >
            <div className="text-center">
              <div className={cn(
                "text-2xl font-bold transition-colors",
                isComplete ? "gradient-text" : "text-foreground"
              )}>
                {currentCount}
              </div>
              <div className="text-xs text-muted-foreground">/ {dhikr.count}</div>
            </div>
          </div>
        </div>

        {isComplete && (
          <div className="text-center">
            <p className="text-sm gradient-text-gold font-semibold animate-pulse">
              ✨ Завершено! Ма ша Аллах
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

AdhkarCard.displayName = "AdhkarCard";
