import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export const MainHeader = () => {
  const location = useLocation();
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
  const logoUrl = "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/cc/e2/51/cce2511d-7436-95af-c944-7dda394c0c3b/AppIcon-0-0-1x_U007emarketing-0-8-0-0-85-220.png/1200x630wa.png";

  return (
    <header className={cn(
      "sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 transition-all duration-500",
      isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
    )}>
      <div className="container mx-auto px-4 py-4 max-w-lg">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 slide-in-left">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 magnetic subtle-float">
                {!logoError ? (
                  <img 
                    src={logoUrl}
                    alt="Logo" 
                    className="w-full h-full object-cover"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <Sparkles className="w-6 h-6 text-primary-foreground wiggle" />
                )}
              </div>
              {/* Online indicator with pulse */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-background" />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-background animate-ping opacity-75" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">{title}</h1>
                <span className="text-lg wiggle-hover cursor-default">{emoji}</span>
              </div>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          {/* Actions with staggered animation */}
          <div className="flex items-center gap-2 slide-in-right">
            <button 
              onClick={() => window.location.href = '/ai-chat'}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 flex items-center justify-center transition-all group magnetic ripple stagger-1 shadow-lg shadow-violet-500/20"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </button>
            <button 
              onClick={() => window.location.href = '/profile'}
              className="w-10 h-10 rounded-xl bg-card hover:bg-secondary flex items-center justify-center transition-all relative group magnetic ripple stagger-2"
            >
              <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              {/* Notification badge with animation */}
              {hasNotification && (
                <>
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-ping" />
                </>
              )}
            </button>
            <button 
              onClick={() => window.location.href = '/profile'}
              className="w-10 h-10 rounded-xl bg-card hover:bg-secondary flex items-center justify-center transition-all group magnetic ripple stagger-3"
            >
              <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:rotate-90 transition-all duration-300" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
