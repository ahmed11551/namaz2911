// Страница Тасбих - дизайн Fintrack (тёмная тема)

import { useSearchParams } from "react-router-dom";
import { MainHeader } from "@/components/layout/MainHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { EnhancedTasbih } from "@/components/dhikr/EnhancedTasbih";

const Tasbih = () => {
  const [searchParams] = useSearchParams();
  const goalId = searchParams.get("goal") || undefined;

  return (
    <div className="min-h-screen bg-background pb-28">
      <MainHeader />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-lg">
        <EnhancedTasbih goalId={goalId} />
      </main>
      <BottomNav />
    </div>
  );
};

export default Tasbih;
