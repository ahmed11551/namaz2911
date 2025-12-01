// Профиль пользователя - стиль Fintrack
import { useState, useEffect, useCallback } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { 
  User, 
  Settings, 
  Bell, 
  BellOff,
  Moon, 
  Sun,
  ChevronRight,
  Trophy,
  Target,
  Flame,
  Star,
  BookOpen,
  Heart,
  Shield,
  LogOut,
  Palette,
  Volume2,
  VolumeX,
  Vibrate,
  Globe,
  HelpCircle,
  MessageCircle,
  Share2,
  Crown,
  Sparkles,
  TrendingUp,
  Calendar,
  Award,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { spiritualPathAPI } from "@/lib/api";
import { useUserData } from "@/hooks/useUserData";
import { useNavigate } from "react-router-dom";
import type { Goal, Badge, Streak } from "@/types/spiritual-path";
import { useToast } from "@/hooks/use-toast";
import { hapticFeedback } from "@/lib/haptics";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

// Типы настроек
interface AppSettings {
  notifications: boolean;
  darkTheme: boolean;
  language: "ru" | "en" | "ar";
  sounds: boolean;
}

const SETTINGS_KEY = "app_settings";
const LANGUAGES = [
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
] as const;

const getDefaultSettings = (): AppSettings => ({
  notifications: true,
    darkTheme: false, // Всегда светлая тема
  language: "ru",
  sounds: true,
});

const loadSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...getDefaultSettings(), ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Error loading settings:", e);
  }
  return getDefaultSettings();
};

const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// Уровни пользователя
const LEVELS = [
  { level: 1, name: "Начинающий", minXP: 0, icon: "🌱" },
  { level: 2, name: "Ученик", minXP: 100, icon: "📚" },
  { level: 3, name: "Практикующий", minXP: 300, icon: "🕌" },
  { level: 4, name: "Постоянный", minXP: 700, icon: "⭐" },
  { level: 5, name: "Мастер", minXP: 1500, icon: "🏆" },
  { level: 6, name: "Наставник", minXP: 3000, icon: "👑" },
];

const getUserLevel = (xp: number) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      const current = LEVELS[i];
      const next = LEVELS[i + 1];
      const progress = next 
        ? ((xp - current.minXP) / (next.minXP - current.minXP)) * 100
        : 100;
      return { ...current, progress, nextLevel: next };
    }
  }
  return { ...LEVELS[0], progress: 0, nextLevel: LEVELS[1] };
};

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userData } = useUserData();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Настройки приложения
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);

  // Применяем светлую тему всегда
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
    root.setAttribute("data-theme", "light");
  }, []);

  // Обновление настроек
  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  // Переключение уведомлений
  const toggleNotifications = async () => {
    hapticFeedback.light();
    if (!settings.notifications) {
      // Включаем уведомления
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          updateSetting("notifications", true);
          hapticFeedback.success();
          toast({
            title: "Уведомления включены",
            description: "Вы будете получать напоминания о намазах",
          });
        } else {
          hapticFeedback.error();
          toast({
            title: "Разрешение отклонено",
            description: "Разрешите уведомления в настройках браузера",
            variant: "destructive",
          });
        }
      } else {
        updateSetting("notifications", true);
        hapticFeedback.success();
        toast({
          title: "Уведомления включены",
          description: "Уведомления будут работать при поддержке браузера",
        });
      }
    } else {
      updateSetting("notifications", false);
      toast({
        title: "Уведомления отключены",
      });
    }
  };

  // Переключение темы - убрано, теперь всегда светлая тема

  // Переключение звуков
  const toggleSounds = () => {
    hapticFeedback.light();
    const newSounds = !settings.sounds;
    updateSetting("sounds", newSounds);
    if (newSounds) {
      // Воспроизводим тестовый звук при включении
      try {
        const audio = new Audio("/sounds/tap.mp3");
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch (e) {
        // Fallback: используем Web Audio API для генерации звука
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = 800;
          oscillator.type = "sine";
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e2) {}
      }
    }
    toast({
      title: newSounds ? "Звуки включены" : "Звуки отключены",
    });
  };

  // Смена языка
  const changeLanguage = (lang: "ru" | "en" | "ar") => {
    hapticFeedback.medium();
    updateSetting("language", lang);
    setLanguageDialogOpen(false);
    toast({
      title: "Язык изменён",
      description: LANGUAGES.find(l => l.code === lang)?.name,
    });
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [goalsData, badgesData, streaksData] = await Promise.all([
          spiritualPathAPI.getGoals("all"),
          spiritualPathAPI.getBadges(),
          spiritualPathAPI.getStreaks(),
        ]);
        setGoals(goalsData);
        setBadges(badgesData);
        setStreaks(streaksData);
      } catch (error) {
        console.error("Error loading profile data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Статистика
  const totalProgress = goals.reduce((sum, g) => sum + g.current_value, 0);
  const completedGoals = goals.filter(g => g.status === "completed").length;
  const currentStreak = streaks.find(s => s.streak_type === "daily_all")?.current_streak || 0;
  const longestStreak = streaks.find(s => s.streak_type === "daily_all")?.longest_streak || 0;
  
  // XP на основе активности
  const xp = totalProgress * 5 + completedGoals * 50 + currentStreak * 10 + badges.length * 100;
  const userLevel = getUserLevel(xp);

  // Каза прогресс
  const qazaTotal = userData?.debt_calculation?.missed_prayers
    ? Object.values(userData.debt_calculation.missed_prayers).reduce((a, b) => a + (b || 0), 0)
    : 0;
  const qazaCompleted = userData?.repayment_progress?.completed_prayers
    ? Object.values(userData.repayment_progress.completed_prayers).reduce((a, b) => a + (b || 0), 0)
    : 0;

  const currentLang = LANGUAGES.find(l => l.code === settings.language);

  const menuItems = [
    { 
      section: "Общее",
      items: [
        { 
          icon: settings.notifications ? Bell : BellOff, 
          label: "Уведомления", 
          value: settings.notifications ? "Включены" : "Выкл", 
          color: settings.notifications ? "text-blue-400" : "text-muted-foreground",
          action: toggleNotifications,
        },
        { 
          icon: Globe, 
          label: "Язык", 
          value: currentLang?.name || "Русский", 
          color: "text-cyan-400",
          action: () => setLanguageDialogOpen(true),
        },
        { 
          icon: settings.sounds ? Volume2 : VolumeX, 
          label: "Звуки", 
          value: settings.sounds ? "Вкл" : "Выкл", 
          color: settings.sounds ? "text-green-400" : "text-muted-foreground",
          action: toggleSounds,
        },
      ]
    },
    {
      section: "Приложение",
      items: [
        { icon: MessageCircle, label: "AI Помощник", action: () => navigate("/ai-chat"), color: "text-violet-400" },
        { icon: Calendar, label: "История", action: () => navigate("/history"), color: "text-orange-400" },
        { icon: Target, label: "Мои цели", action: () => navigate("/goals"), color: "text-primary" },
        { icon: TrendingUp, label: "Статистика", action: () => navigate("/statistics"), color: "text-pink-400" },
      ]
    },
    {
      section: "Поддержка",
      items: [
        { icon: HelpCircle, label: "Помощь", color: "text-yellow-400", action: () => {
          toast({ title: "Помощь", description: "Свяжитесь с нами: support@namaz.app" });
        }},
        { icon: Share2, label: "Поделиться", color: "text-blue-400", action: async () => {
          if (navigator.share) {
            try {
              await navigator.share({
                title: "Трекер намазов",
                text: "Отслеживайте намазы и духовный прогресс",
                url: window.location.origin,
              });
            } catch (e) {}
          } else {
            navigator.clipboard.writeText(window.location.origin);
            toast({ title: "Ссылка скопирована!" });
          }
        }},
        { icon: Star, label: "Оценить приложение", color: "text-amber-400", action: () => {
          toast({ title: "Спасибо!", description: "Ваша оценка важна для нас 💚" });
        }},
      ]
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-28">
        <MainHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Загрузка...</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <MainHeader />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-lg">
        {/* Profile Header Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 text-white">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl sm:text-4xl subtle-float">
                  {userLevel.icon}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-bold shadow-lg">
                  {userLevel.level}
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">Мусульманин</h2>
                <p className="text-white/70 text-sm mb-2">{userLevel.name}</p>
                
                {/* Level Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/70">Уровень {userLevel.level}</span>
                    <span className="text-white/70">{xp} XP</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-1000"
                      style={{ width: `${userLevel.progress}%` }}
                    />
                  </div>
                  {userLevel.nextLevel && (
                    <p className="text-[10px] text-white/50 text-right">
                      До уровня {userLevel.nextLevel.level}: {userLevel.nextLevel.minXP - xp} XP
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: Flame, value: currentStreak, label: "Серия" },
                { icon: Target, value: goals.length, label: "Целей" },
                { icon: Trophy, value: badges.length, label: "Бейджей" },
                { icon: Star, value: totalProgress, label: "Действий" },
              ].map((stat, i) => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-2 text-center">
                  <stat.icon className="w-4 h-4 mx-auto mb-1 text-white/70" />
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-[10px] text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Achievements Preview */}
        <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border/50 mb-4 sm:mb-6 slide-up stagger-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Достижения
            </h3>
            <button 
              onClick={() => navigate("/statistics")}
              className="text-primary text-sm font-medium"
            >
              Все
            </button>
          </div>
          
          {badges.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {badges.slice(0, 5).map((badge, i) => (
                <div 
                  key={badge.id}
                  className="flex-shrink-0 w-16 text-center"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 flex items-center justify-center text-2xl mx-auto mb-1 wiggle-hover">
                    🏆
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{badge.badge_type}</p>
                </div>
              ))}
              <div className="flex-shrink-0 w-16 text-center">
                <button 
                  onClick={() => navigate("/statistics")}
                  className="w-14 h-14 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground mx-auto mb-1 hover:border-primary transition-colors"
                >
                  +
                </button>
                <p className="text-[10px] text-muted-foreground">Ещё</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Award className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Выполняйте цели для получения достижений</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="bg-card rounded-2xl p-4 border border-border/50 slide-up stagger-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{longestStreak}</p>
                <p className="text-xs text-muted-foreground">Лучшая серия</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 border border-border/50 slide-up stagger-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{qazaCompleted}</p>
                <p className="text-xs text-muted-foreground">Каза намазов</p>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        {menuItems.map((section, sectionIdx) => (
          <div key={section.section} className="mb-4 sm:mb-6 slide-up" style={{ animationDelay: `${0.3 + sectionIdx * 0.1}s` }}>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 px-1">{section.section}</h4>
            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (item.action) {
                      item.action();
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-4 min-h-[56px] hover:bg-secondary/50 active:bg-secondary/70 transition-all interactive haptic-light",
                    i !== section.items.length - 1 && "border-b border-border/30"
                  )}
                  aria-label={item.label}
                >
                  <div className={cn("w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0", item.color)}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="flex-1 text-left text-foreground font-medium text-base">{item.label}</span>
                  {item.value && (
                    <span className="text-sm text-muted-foreground font-medium">{item.value}</span>
                  )}
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Version Info */}
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground">Версия 1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">С любовью для уммы 💚</p>
        </div>
      </main>

      {/* Language Dialog */}
      <Dialog open={languageDialogOpen} onOpenChange={setLanguageDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Выберите язык
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  changeLanguage(lang.code);
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-4 min-h-[56px] rounded-xl transition-all interactive haptic-light",
                  settings.language === lang.code
                    ? "bg-primary/20 border-2 border-primary"
                    : "bg-secondary hover:bg-secondary/80 active:bg-secondary/90 border-2 border-transparent"
                )}
                aria-label={`Выбрать язык: ${lang.name}`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="flex-1 text-left font-medium text-base">{lang.name}</span>
                {settings.language === lang.code && (
                  <Check className="w-5 h-5 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Profile;

