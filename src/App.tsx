import { useEffect, useState, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { initTelegramWebApp } from "./lib/telegram";
import { ConsentDialog } from "./components/qaza/ConsentDialog";
import { Loader2 } from "lucide-react";

// Lazy loading для всех страниц для быстрой загрузки
const Index = lazy(() => import("./pages/Index"));
const Goals = lazy(() => import("./pages/Goals"));
const Dhikr = lazy(() => import("./pages/Dhikr"));
const Tasbih = lazy(() => import("./pages/Tasbih"));
const Statistics = lazy(() => import("./pages/Statistics"));
const AIChat = lazy(() => import("./pages/AIChat"));
const Profile = lazy(() => import("./pages/Profile"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const History = lazy(() => import("./pages/History"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Компонент загрузки
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Загрузка...</p>
    </div>
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
