import { Target, BookOpen, Calculator, Sparkles, BarChart3 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/useMobile";
import { useState, useEffect } from "react";

export const BottomNav = () => {
  const location = useLocation();
  const { isMobile } = useMobile();
  const [isVisible, setIsVisible] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);

  useEffect(() => {
    // Animate in on mount
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Trigger animation on route change
    if (prevPath !== location.pathname) {
      setPrevPath(location.pathname);
    }
  }, [location.pathname, prevPath]);

  const navItems = [
    { path: "/goals", icon: Target, label: "Цели" },
    { path: "/dhikr", icon: BookOpen, label: "Зикры" },
    { path: "/", icon: Calculator, label: "Каза", isMain: true },
    { path: "/tasbih", icon: Sparkles, label: "Тасбих" },
    { path: "/statistics", icon: BarChart3, label: "Отчёты" },
  ];

  if (!isMobile) {
    return null;
  }

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 pb-safe transition-all duration-500",
      isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
    )}>
      {/* Glass background with blur */}
      <div className="absolute inset-0 bg-white/95 backdrop-blur-xl border-t-2 border-gray-200" />
      
      <div className="relative container mx-auto px-3 max-w-lg">
        <div className="flex justify-around items-center h-24 py-3">
          {navItems.map(({ path, icon: Icon, label, isMain }, index) => {
            const isActive = location.pathname === path;
            
            if (isMain) {
              // Central main button - увеличен для удобства
              return (
                <Link
                  key={path}
                  to={path}
                  className="relative -mt-7 interactive haptic-medium"
                  onClick={() => {
                    // Haptic feedback для мобильных
                    if (window.Telegram?.WebApp?.HapticFeedback) {
                      window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
                    }
                  }}
                >
                  <div className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300",
                    "bg-gradient-to-br from-primary to-primary-dark",
                    "shadow-lg shadow-primary/30",
                    isActive && "breathing-glow scale-105",
                    "hover:scale-110 active:scale-95"
                  )}>
                    <Icon className={cn(
                      "w-8 h-8 text-primary-foreground transition-transform",
                      isActive && "scale-110"
                    )} />
                    
                    {/* Animated ring on active */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl ring-pulse" />
                    )}
                  </div>
                  <span className={cn(
                    "block text-center text-xs font-semibold mt-2 transition-all",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {label}
                  </span>
                </Link>
              );
            }
            
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 px-2 py-2 min-w-[64px] group interactive haptic-light",
                  "slide-up"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => {
                  // Haptic feedback
                  if (window.Telegram?.WebApp?.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
                  }
                }}
              >
                <div className={cn(
                  "relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                  isActive 
                    ? "bg-primary/20 border-2 border-primary/50" 
                    : "bg-transparent border-2 border-transparent group-hover:bg-secondary/50"
                )}>
                  <Icon className={cn(
                    "w-6 h-6 transition-all duration-300",
                    isActive 
                      ? "text-primary scale-110" 
                      : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  
                  {/* Active indicator dot with pulse */}
                  {isActive && (
                    <>
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary animate-ping" />
                    </>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-medium transition-colors leading-tight",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
