// Диалог приветствия для новых пользователей

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator, Sparkles } from "lucide-react";
import { useUserData } from "@/hooks/useUserData";

interface WelcomeDialogProps {
  onNavigateToCalculator: () => void;
}

export const WelcomeDialog = ({ onNavigateToCalculator }: WelcomeDialogProps) => {
  const { userData, loading } = useUserData();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Показываем диалог только если нет данных пользователя
    if (!loading && !userData) {
      // Проверяем, не показывали ли уже диалог
      const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
      if (!hasSeenWelcome) {
        setOpen(true);
      }
    }
  }, [userData, loading]);

  const handleYes = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setOpen(false);
    onNavigateToCalculator();
  };

  const handleNo = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setOpen(false);
  };

  if (loading || userData) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Добро пожаловать в Трекер намазов!
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Вам помочь с подсчетом за прошлые пропущенные намазы?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={handleYes}
            size="lg"
            className="w-full bg-primary hover:opacity-90"
          >
            <Calculator className="w-5 h-5 mr-2" />
            Да, помочь посчитать
          </Button>
          <Button
            onClick={handleNo}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Нет, спасибо
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          Вы всегда можете начать расчет позже в разделе "Калькулятор"
        </p>
      </DialogContent>
    </Dialog>
  );
};

