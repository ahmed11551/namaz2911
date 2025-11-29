// Страница Каза - Пропущенные намазы (дизайн Fintrack с анимациями)

import { useState, useRef, useEffect } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { CalculatorSection } from "@/components/qaza/CalculatorSection";
import { ProgressSection } from "@/components/qaza/ProgressSection";
import { ReportsSection } from "@/components/qaza/ReportsSection";
import { RepaymentPlanSection } from "@/components/qaza/RepaymentPlanSection";
import { OverviewDashboard } from "@/components/dashboard/OverviewDashboard";
import { WelcomeDialog } from "@/components/qaza/WelcomeDialog";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calculator,
  TrendingUp,
  Calendar,
  BarChart3,
} from "lucide-react";

type TabType = "overview" | "calculator" | "plan" | "progress" | "reports";

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Обзор", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "calculator", label: "Расчёт", icon: <Calculator className="w-4 h-4" /> },
  { id: "plan", label: "План", icon: <Calendar className="w-4 h-4" /> },
  { id: "progress", label: "Прогресс", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "reports", label: "Отчёты", icon: <BarChart3 className="w-4 h-4" /> },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const handleNavigateToCalculator = () => {
    handleTabChange("calculator");
  };

  const handleTabChange = (newTab: TabType) => {
    if (newTab === activeTab) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsTransitioning(false);
    }, 150);
  };

  // Animate content on mount
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Автоскролл к активной вкладке
  useEffect(() => {
    if (tabsRef.current) {
      const activeButton = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeButton) {
        (activeButton as HTMLElement).scrollIntoView({ 
          behavior: "smooth", 
          block: "nearest", 
          inline: "center" 
        });
      }
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <MainHeader />
      <WelcomeDialog onNavigateToCalculator={handleNavigateToCalculator} />

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {/* Tabs Navigation - Fintrack Style with animations */}
        <div
          ref={tabsRef}
          className={cn(
            "flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 transition-opacity duration-300",
            showContent ? "opacity-100" : "opacity-0"
          )}
        >
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => {
                handleTabChange(tab.id);
                // Haptic feedback
                if (window.Telegram?.WebApp?.HapticFeedback) {
                  window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
                }
              }}
              className={cn(
                "flex items-center gap-2.5 px-5 py-3 rounded-xl whitespace-nowrap transition-all flex-shrink-0 text-base font-medium slide-up interactive haptic-light",
                "min-h-[48px]",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105"
                  : "bg-card text-muted-foreground border-2 border-border/50 hover:border-primary/30 hover:text-foreground hover:bg-card/80"
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span className={cn(
                "transition-transform duration-300",
                activeTab === tab.id && "scale-110"
              )}>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content with transition animation */}
        <div className={cn(
          "min-h-[60vh] transition-all duration-300",
          isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        )}>
          {activeTab === "overview" && <OverviewDashboard onNavigateToCalculator={handleNavigateToCalculator} />}
          {activeTab === "calculator" && <CalculatorSection />}
          {activeTab === "plan" && <RepaymentPlanSection />}
          {activeTab === "progress" && <ProgressSection />}
          {activeTab === "reports" && <ReportsSection />}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
