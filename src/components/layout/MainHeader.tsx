import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticFeedback } from "@/lib/haptics";

export const MainHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasNotification] = useState(true); // Demo notification
  
  useEffect(() => {
    // Animate header in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  const getPageInfo = () => {
    switch (location.pathname) {
      case "/goals":
        return { title: "Цели", subtitle: "Привычки и достижения", emoji: "🎯" };
      case "/dhikr":
        return { title: "Зикры", subtitle: "Дуа и поминания", emoji: "📿" };
      case "/tasbih":
        return { title: "Тасбих", subtitle: "Счётчик зикров", emoji: "✨" };
      case "/statistics":
        return { title: "Статистика", subtitle: "Ваш прогресс", emoji: "📊" };
      default:
        return { title: "Каза", subtitle: "Пропущенные намазы", emoji: "🕌" };
    }
  };

  const { title, subtitle, emoji } = getPageInfo();

  return (
    <header className={cn(
      "sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-all duration-500",
      isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    )}>
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-5 max-w-lg">
        <div className="flex items-center justify-between gap-3">
          {/* Logo & Title - улучшенная читаемость */}
          <div className="flex items-center gap-3.5 slide-in-left flex-1 min-w-0">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 magnetic subtle-float">
                {!logoError ? (
                  <img 
                    src="/logo.svg"
                    alt="Logo" 
                    className="w-full h-full object-cover p-1"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <Sparkles className="w-7 h-7 text-primary-foreground" />
                )}
              </div>
              {/* Online indicator with pulse */}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full border-2 border-background" />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-primary rounded-full border-2 border-background animate-ping opacity-75" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">{title}</h1>
                <span className="text-xl sm:text-2xl wiggle-hover cursor-default">{emoji}</span>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>
            </div>
          </div>

          {/* Actions - увеличенные для удобства */}
          <div className="flex items-center gap-2 slide-in-right shrink-0">
            <button 
              onClick={() => {
                hapticFeedback.light();
                navigate('/ai-chat');
              }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 flex items-center justify-center transition-all group interactive haptic-light shadow-lg shadow-violet-500/20"
              aria-label="AI Помощник"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </button>
            <button 
              onClick={() => {
                hapticFeedback.light();
                navigate('/profile');
              }}
              className="w-12 h-12 rounded-xl bg-card hover:bg-secondary flex items-center justify-center transition-all relative group interactive haptic-light"
              aria-label="Уведомления"
            >
              <Bell className="w-6 h-6 text-muted-foreground group-hover:text-foreground transition-colors" />
              {/* Notification badge with animation */}
              {hasNotification && (
                <>
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-primary rounded-full" />
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
                </>
              )}
            </button>
            <button 
              onClick={() => {
                hapticFeedback.light();
                navigate('/profile');
              }}
              className="w-12 h-12 rounded-xl bg-card hover:bg-secondary flex items-center justify-center transition-all group interactive haptic-light"
              aria-label="Настройки"
            >
              <Settings className="w-6 h-6 text-muted-foreground group-hover:text-foreground group-hover:rotate-90 transition-all duration-300" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
