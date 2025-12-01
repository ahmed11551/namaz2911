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
    <div className="min-h-screen bg-gray-50 pb-28">
      <MainHeader />
      <WelcomeDialog onNavigateToCalculator={handleNavigateToCalculator} />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-lg">
        {/* Tabs Navigation - упрощённый */}
        <div
          ref={tabsRef}
          className={cn(
            "flex gap-3 mb-6 sm:mb-8 overflow-x-auto no-scrollbar pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6",
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
                "flex items-center gap-3 px-6 py-3.5 rounded-xl whitespace-nowrap transition-all flex-shrink-0 text-base font-medium",
                "min-h-[48px]",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-muted-foreground border border-border/50 hover:border-primary/30 hover:text-foreground"
              )}
            >
              <span>
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={cn(
          "min-h-[60vh] transition-opacity duration-200",
          isTransitioning ? "opacity-50" : "opacity-100"
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
