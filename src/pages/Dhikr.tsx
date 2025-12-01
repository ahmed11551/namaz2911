// Страница Зикры - дизайн Fintrack (тёмная тема)

import { useState, useRef, useEffect } from "react";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { DuaSectionV2 } from "@/components/dhikr/DuaSectionV2";
import { AdhkarSectionV2 } from "@/components/dhikr/AdhkarSectionV2";
import { SalawatSection } from "@/components/dhikr/SalawatSection";
import { KalimaSection } from "@/components/dhikr/KalimaSection";
import { cn } from "@/lib/utils";
import { Heart, Star, Sparkles, BookOpen } from "lucide-react";

type TabType = "dua" | "adhkar" | "salawat" | "kalima";

const TABS: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "dua", label: "Дуа", icon: <Heart className="w-4 h-4" /> },
  { id: "adhkar", label: "Азкары", icon: <Star className="w-4 h-4" /> },
  { id: "salawat", label: "Салаваты", icon: <Sparkles className="w-4 h-4" /> },
  { id: "kalima", label: "Калимы", icon: <BookOpen className="w-4 h-4" /> },
];

const Dhikr = () => {
  const [activeTab, setActiveTab] = useState<TabType>("dua");
  const tabsRef = useRef<HTMLDivElement>(null);

  // Автоскролл к активной вкладке
  useEffect(() => {
    if (tabsRef.current) {
      const activeButton = tabsRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeButton) {
        activeButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <MainHeader />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-lg">
        {/* Category Tabs - упрощённый */}
        <div
          ref={tabsRef}
          className="flex gap-3 mb-8 overflow-x-auto no-scrollbar pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-6 py-3.5 rounded-xl whitespace-nowrap transition-all flex-shrink-0 font-medium",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-muted-foreground border border-border/50 hover:border-primary/30 hover:text-foreground"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[60vh]">
          {activeTab === "dua" && <DuaSectionV2 />}
          {activeTab === "adhkar" && <AdhkarSectionV2 />}
          {activeTab === "salawat" && <SalawatSection />}
          {activeTab === "kalima" && <KalimaSection />}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dhikr;
