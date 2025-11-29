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
      <div className="absolute inset-0 bg-card/90 backdrop-blur-xl border-t border-border/50" />
      
      <div className="relative container mx-auto px-2 max-w-lg">
        <div className="flex justify-around items-center h-20 py-2">
          {navItems.map(({ path, icon: Icon, label, isMain }, index) => {
            const isActive = location.pathname === path;
            
            if (isMain) {
              // Central main button with glow effect
              return (
                <Link
                  key={path}
                  to={path}
                  className="relative -mt-6"
                >
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300",
                    "bg-gradient-to-br from-primary to-primary-dark",
                    "shadow-lg shadow-primary/30 magnetic",
                    isActive && "breathing-glow scale-105",
                    "hover:scale-110 active:scale-95"
                  )}>
                    <Icon className={cn(
                      "w-7 h-7 text-primary-foreground transition-transform",
                      isActive && "scale-110"
                    )} />
                    
                    {/* Animated ring on active */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl ring-pulse" />
                    )}
                  </div>
                  <span className={cn(
                    "block text-center text-[10px] font-medium mt-1.5 transition-all",
                    isActive ? "text-primary text-glow" : "text-muted-foreground"
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
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] group",
                  "slide-up"
                )}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={cn(
                  "relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 magnetic",
                  isActive 
                    ? "bg-primary/15" 
                    : "bg-transparent group-hover:bg-secondary"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive 
                      ? "text-primary scale-110" 
                      : "text-muted-foreground group-hover:text-foreground"
                  )} />
                  
                  {/* Active indicator dot with pulse */}
                  {isActive && (
                    <>
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    </>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
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
