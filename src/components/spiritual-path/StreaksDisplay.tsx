// Компонент для отображения серий (streaks)

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, TrendingUp, Calendar } from "lucide-react";
import { spiritualPathAPI } from "@/lib/api";
import type { Streak } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  prayer: "Намаз",
  quran: "Коран",
  zikr: "Зикр/Дуа",
  sadaqa: "Садака",
  knowledge: "Знания",
  names_of_allah: "99 имен Аллаха",
};

export const StreaksDisplay = () => {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreaks();
  }, []);

  const loadStreaks = async () => {
    setLoading(true);
    try {
      const data = await spiritualPathAPI.getStreaks();
      setStreaks(data);
    } catch (error) {
      console.error("Error loading streaks:", error);
    } finally {
      setLoading(false);
    }
  };

  const dailyStreak = streaks.find(s => s.streak_type === "daily_all");
  const categoryStreaks = streaks.filter(s => s.streak_type === "category");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка серий...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <Flame className="w-6 h-6 text-primary" />
          Мои серии
        </h2>
        <p className="text-sm text-muted-foreground">
          Отслеживайте непрерывное выполнение целей
        </p>
      </div>

      {/* Daily Streak */}
      {dailyStreak && (
        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Ежедневная серия</CardTitle>
                  <CardDescription>
                    Выполнение всех ежедневных целей подряд
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text-orange mb-1">
                  {dailyStreak.current_streak}
                </div>
                <div className="text-sm text-muted-foreground">Текущая серия</div>
              </div>
              <div className="h-16 w-px bg-border" />
              <div className="text-center">
                <div className="text-4xl font-bold text-muted-foreground mb-1">
                  {dailyStreak.longest_streak}
                </div>
                <div className="text-sm text-muted-foreground">Лучшая серия</div>
              </div>
            </div>
            {dailyStreak.current_streak > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-center">
                  🔥 Продолжайте в том же духе! Вы на правильном пути
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category Streaks */}
      {categoryStreaks.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Серии по категориям
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {categoryStreaks.map((streak) => (
              <Card key={streak.id} className="bg-gradient-card border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {CATEGORY_LABELS[streak.category || ""] || "Неизвестная категория"}
                      </CardTitle>
                      <CardDescription>Категорийная серия</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-lg font-bold">
                      {streak.current_streak} 🔥
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Лучшая серия:</span>
                    <span className="font-semibold">{streak.longest_streak} дней</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Пустое состояние */}
      {!dailyStreak && categoryStreaks.length === 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Flame className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">
                У вас пока нет активных серий
              </p>
              <p className="text-sm text-muted-foreground">
                Выполняйте цели ежедневно, чтобы начать серию!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

