// Компонент для отображения бейджей

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Medal, Star } from "lucide-react";
import { spiritualPathAPI } from "@/lib/api";
import type { Badge as BadgeType } from "@/types/spiritual-path";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const BADGE_INFO: Record<string, { label: string; description: string; icon: string }> = {
  prayer_consistency: {
    label: "Неуклонный в намазе",
    description: "Регулярное выполнение намазов",
    icon: "🕌",
  },
  quran_completion: {
    label: "Сердце Корана",
    description: "Прочтение всего Корана",
    icon: "📖",
  },
  sadaqa_regularity: {
    label: "Рука щедрости",
    description: "Регулярная садака",
    icon: "💝",
  },
  zikr_consistency: {
    label: "Сахих",
    description: "Постоянное поминание Аллаха",
    icon: "📿",
  },
  streak_master: {
    label: "Мастер серий",
    description: "Долгие серии выполнения",
    icon: "🔥",
  },
  goal_achiever: {
    label: "Достигатель целей",
    description: "Регулярное достижение целей",
    icon: "🎯",
  },
};

const LEVEL_COLORS = {
  copper: {
    bg: "from-amber-600/20 to-amber-800/20",
    border: "border-amber-500/30",
    text: "text-amber-600",
    icon: "🥉",
  },
  silver: {
    bg: "from-gray-300/20 to-gray-500/20",
    border: "border-gray-400/30",
    text: "text-gray-600",
    icon: "🥈",
  },
  gold: {
    bg: "from-yellow-400/20 to-yellow-600/20",
    border: "border-yellow-500/30",
    text: "text-yellow-600",
    icon: "🥇",
  },
};

export const BadgesDisplay = () => {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const data = await spiritualPathAPI.getBadges();
      setBadges(data);
    } catch (error) {
      console.error("Error loading badges:", error);
    } finally {
      setLoading(false);
    }
  };

  // Группируем бейджи по типу
  const groupedBadges = badges.reduce((acc, badge) => {
    if (!acc[badge.badge_type]) {
      acc[badge.badge_type] = [];
    }
    acc[badge.badge_type].push(badge);
    return acc;
  }, {} as Record<string, BadgeType[]>);

  // Сортируем бейджи по уровню (copper < silver < gold)
  const sortBadges = (badges: BadgeType[]) => {
    const order = { copper: 1, silver: 2, gold: 3 };
    return badges.sort((a, b) => order[a.level] - order[b.level]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка бейджей...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <Trophy className="w-6 h-6 text-primary" />
          Мои бейджи
        </h2>
        <p className="text-sm text-muted-foreground">
          Достижения в вашем духовном пути
        </p>
      </div>

      {Object.keys(groupedBadges).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedBadges).map(([badgeType, badgeList]) => {
            const info = BADGE_INFO[badgeType];
            const sortedBadges = sortBadges(badgeList);
            const highestLevel = sortedBadges[sortedBadges.length - 1];

            return (
              <Card
                key={badgeType}
                className={cn(
                  "bg-gradient-to-br border-2",
                  LEVEL_COLORS[highestLevel.level].bg,
                  LEVEL_COLORS[highestLevel.level].border
                )}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{info.icon}</div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{info.label}</CardTitle>
                      <CardDescription>{info.description}</CardDescription>
                    </div>
                    <div className="text-3xl">{LEVEL_COLORS[highestLevel.level].icon}</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    {sortedBadges.map((badge) => {
                      const levelInfo = LEVEL_COLORS[badge.level];
                      return (
                        <div
                          key={badge.id}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-lg border-2",
                            levelInfo.bg,
                            levelInfo.border
                          )}
                        >
                          <div className="text-2xl">{levelInfo.icon}</div>
                          <div className={cn("font-semibold text-sm", levelInfo.text)}>
                            {badge.level === "copper" ? "Медь" :
                             badge.level === "silver" ? "Серебро" : "Золото"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(badge.achieved_at), "dd.MM.yyyy")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">
                У вас пока нет бейджей
              </p>
              <p className="text-sm text-muted-foreground">
                Выполняйте цели и достигайте новых высот, чтобы получить бейджи!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Информация о бейджах */}
      <Card className="bg-secondary/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            О бейджах
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Бейджи выдаются за достижения в духовных практиках:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Медь</strong> - базовые достижения</li>
            <li><strong>Серебро</strong> - значительные успехи</li>
            <li><strong>Золото</strong> - выдающиеся достижения</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

