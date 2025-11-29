// Еженедельные челленджи - геймификация
import { useState, useEffect } from "react";
import { 
  Trophy, 
  Target, 
  BookOpen, 
  Heart, 
  Sparkles, 
  Clock,
  Check,
  ChevronRight,
  Gift,
  Flame,
  Star,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { playSound } from "@/lib/sounds";

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  target: number;
  current: number;
  reward: string;
  rewardXP: number;
  type: "daily" | "weekly";
  category: "prayer" | "quran" | "zikr" | "sadaqa" | "general";
  expiresAt: Date;
}

// Генерация челленджей на неделю
const generateWeeklyChallenges = (): Challenge[] => {
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  endOfWeek.setHours(23, 59, 59);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59);

  return [
    {
      id: "weekly_quran",
      title: "Читатель Корана",
      description: "Прочитайте 7 страниц Корана за неделю",
      icon: BookOpen,
      gradient: "from-emerald-500 to-teal-600",
      target: 7,
      current: 2,
      reward: "Бейдж 'Любитель Корана'",
      rewardXP: 100,
      type: "weekly",
      category: "quran",
      expiresAt: endOfWeek,
    },
    {
      id: "weekly_zikr",
      title: "Мастер Зикра",
      description: "Сделайте 1000 зикров за неделю",
      icon: Sparkles,
      gradient: "from-purple-500 to-violet-600",
      target: 1000,
      current: 456,
      reward: "Бейдж 'Поминающий'",
      rewardXP: 150,
      type: "weekly",
      category: "zikr",
      expiresAt: endOfWeek,
    },
    {
      id: "weekly_streak",
      title: "Неделя без пропусков",
      description: "Выполняйте цели 7 дней подряд",
      icon: Flame,
      gradient: "from-orange-500 to-red-600",
      target: 7,
      current: 3,
      reward: "Бейдж 'Неустанный'",
      rewardXP: 200,
      type: "weekly",
      category: "general",
      expiresAt: endOfWeek,
    },
    {
      id: "daily_morning",
      title: "Утренние азкары",
      description: "Прочитайте утренние азкары сегодня",
      icon: Star,
      gradient: "from-amber-500 to-orange-600",
      target: 1,
      current: 0,
      reward: "+25 XP",
      rewardXP: 25,
      type: "daily",
      category: "zikr",
      expiresAt: endOfDay,
    },
    {
      id: "daily_sadaqa",
      title: "День щедрости",
      description: "Сделайте хотя бы одну садаку",
      icon: Heart,
      gradient: "from-pink-500 to-rose-600",
      target: 1,
      current: 0,
      reward: "+30 XP",
      rewardXP: 30,
      type: "daily",
      category: "sadaqa",
      expiresAt: endOfDay,
    },
  ];
};

// Форматирование оставшегося времени
const formatTimeLeft = (expiresAt: Date): string => {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  
  if (diff <= 0) return "Истекло";
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}д ${hours}ч`;
  if (hours > 0) return `${hours}ч`;
  
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}м`;
};

interface ChallengeCardProps {
  challenge: Challenge;
  onClaim?: () => void;
}

const ChallengeCard = ({ challenge, onClaim }: ChallengeCardProps) => {
  const progress = (challenge.current / challenge.target) * 100;
  const isComplete = challenge.current >= challenge.target;
  const Icon = challenge.icon;

  const handleClaim = () => {
    if (isComplete && onClaim) {
      playSound("levelUp");
      onClaim();
    }
  };

  return (
    <div className={cn(
      "bg-card rounded-2xl p-4 border transition-all",
      isComplete 
        ? "border-primary/50 bg-primary/5" 
        : "border-border/50 hover:border-border"
    )}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          isComplete 
            ? "bg-primary text-primary-foreground" 
            : `bg-gradient-to-br ${challenge.gradient} text-white`
        )}>
          {isComplete ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={cn(
              "font-semibold text-sm",
              isComplete ? "text-primary" : "text-foreground"
            )}>
              {challenge.title}
            </h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-medium",
              challenge.type === "daily" 
                ? "bg-amber-500/20 text-amber-500" 
                : "bg-blue-500/20 text-blue-500"
            )}>
              {challenge.type === "daily" ? "Ежедневный" : "Недельный"}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground mb-2">{challenge.description}</p>
          
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isComplete 
                    ? "bg-primary" 
                    : `bg-gradient-to-r ${challenge.gradient}`
                )}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {challenge.current}/{challenge.target}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {formatTimeLeft(challenge.expiresAt)}
            </div>
            
            {isComplete ? (
              <button 
                onClick={handleClaim}
                className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium flex items-center gap-1 hover:bg-primary-dark transition-colors"
              >
                <Gift className="w-3 h-3" />
                Забрать награду
              </button>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="w-3 h-3 text-amber-500" />
                +{challenge.rewardXP} XP
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface WeeklyChallengesProps {
  variant?: "full" | "compact";
  className?: string;
}

export const WeeklyChallenges = ({ variant = "compact", className }: WeeklyChallengesProps) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "daily" | "weekly">("all");

  useEffect(() => {
    // Загружаем или генерируем челленджи
    const saved = localStorage.getItem("weekly_challenges");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Восстанавливаем даты
        parsed.forEach((c: any) => {
          c.expiresAt = new Date(c.expiresAt);
        });
        setChallenges(parsed);
      } catch {
        setChallenges(generateWeeklyChallenges());
      }
    } else {
      setChallenges(generateWeeklyChallenges());
    }
  }, []);

  // Сохраняем при изменении
  useEffect(() => {
    if (challenges.length > 0) {
      localStorage.setItem("weekly_challenges", JSON.stringify(challenges));
    }
  }, [challenges]);

  const handleClaim = (challengeId: string) => {
    setChallenges(prev => prev.filter(c => c.id !== challengeId));
    // Здесь можно добавить логику начисления XP
  };

  const filteredChallenges = challenges.filter(c => {
    if (activeTab === "all") return true;
    return c.type === activeTab;
  });

  const completedCount = challenges.filter(c => c.current >= c.target).length;

  if (variant === "compact") {
    // Компактная версия для главной страницы
    const topChallenges = challenges.slice(0, 2);
    
    return (
      <div className={cn("bg-card rounded-2xl p-4 border border-border/50", className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Челленджи</h3>
              <p className="text-xs text-muted-foreground">{completedCount} из {challenges.length} выполнено</p>
            </div>
          </div>
          <button className="text-primary text-xs font-medium flex items-center gap-1">
            Все
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2">
          {topChallenges.map(challenge => {
            const ChallengeIcon = challenge.icon;
            return (
              <div
                key={challenge.id}
                className="flex items-center gap-3 p-2 bg-secondary/50 rounded-xl"
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  `bg-gradient-to-br ${challenge.gradient}`
                )}>
                  <ChallengeIcon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{challenge.title}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${challenge.gradient} rounded-full`}
                        style={{ width: `${(challenge.current / challenge.target) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {challenge.current}/{challenge.target}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Полная версия
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-lg">Челленджи</h2>
            <p className="text-sm text-muted-foreground">
              {completedCount} из {challenges.length} выполнено
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: "all", label: "Все" },
          { id: "daily", label: "Ежедневные" },
          { id: "weekly", label: "Недельные" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Challenges List */}
      <div className="space-y-3">
        {filteredChallenges.map(challenge => (
          <ChallengeCard 
            key={challenge.id} 
            challenge={challenge}
            onClaim={() => handleClaim(challenge.id)}
          />
        ))}

        {filteredChallenges.length === 0 && (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Все челленджи выполнены! 🎉</p>
          </div>
        )}
      </div>
    </div>
  );
};

