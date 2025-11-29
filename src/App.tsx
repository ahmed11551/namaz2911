import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Goals from "./pages/Goals";
import Dhikr from "./pages/Dhikr";
import Tasbih from "./pages/Tasbih";
import Statistics from "./pages/Statistics";
import AIChat from "./pages/AIChat";
import Profile from "./pages/Profile";
import Onboarding from "./pages/Onboarding";
import History from "./pages/History";
import NotFound from "./pages/NotFound";
import { initTelegramWebApp } from "./lib/telegram";
import { ConsentDialog } from "./components/qaza/ConsentDialog";

const queryClient = new QueryClient();

// Компонент для проверки первого запуска
const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const completed = localStorage.getItem("onboarding_completed");
    setShowOnboarding(!completed);
  }, []);

  if (showOnboarding === null) {
    return null; // Загрузка
  }

  if (showOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  useEffect(() => {
    // Инициализация Telegram WebApp при загрузке
    initTelegramWebApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ConsentDialog />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<OnboardingGuard><Index /></OnboardingGuard>} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/dhikr" element={<Dhikr />} />
            <Route path="/tasbih" element={<Tasbih />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/ai-chat" element={<AIChat />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/history" element={<History />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
