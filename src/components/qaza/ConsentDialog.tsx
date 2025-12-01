// Компонент согласия на обработку персональных данных

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";

const CONSENT_KEY = "prayer_debt_consent";

export function ConsentDialog() {
  const [open, setOpen] = useState(false);
  const [consented, setConsented] = useState(false);
  const [readTerms, setReadTerms] = useState(false);

  useEffect(() => {
    // Проверяем, дано ли согласие
    const hasConsented = localStorage.getItem(CONSENT_KEY);
    if (!hasConsented) {
      setOpen(true);
    }
  }, []);

  const handleAccept = () => {
    if (!readTerms) {
      return;
    }

    // Сохраняем согласие
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      date: new Date().toISOString(),
      version: "1.0.0",
    }));

    setConsented(true);
    setOpen(false);
  };

  const handleDecline = () => {
    // Если пользователь отказывается, можно показать предупреждение
    // или ограничить функциональность
    setOpen(false);
  };

  if (consented || localStorage.getItem(CONSENT_KEY)) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <DialogTitle>Согласие на обработку персональных данных</DialogTitle>
          </div>
          <DialogDescription>
            Для работы приложения необходимо ваше согласие на обработку персональных данных
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Мы обрабатываем следующие данные:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Дата рождения (для расчета булюга)</li>
                <li>Пол (для учета женских периодов)</li>
                <li>Количество детей (для расчета нифаса)</li>
                <li>Дни цикла (для расчета хайда)</li>
                <li>Дни в пути (для расчета сафар-намазов)</li>
                <li>Прогресс восполнения намазов</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                Все данные хранятся локально на вашем устройстве или в защищенном облачном хранилище Telegram.
                Мы не передаем ваши данные третьим лицам.
              </p>
              <p>
                Данные используются исключительно для расчета пропущенных намазов и отслеживания прогресса
                их восполнения.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="readTerms"
              checked={readTerms}
              onCheckedChange={(checked) => setReadTerms(checked === true)}
            />
            <Label
              htmlFor="readTerms"
              className="text-sm cursor-pointer leading-relaxed"
            >
              Я прочитал(а) и согласен(на) с условиями обработки персональных данных
            </Label>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleDecline}
            className="flex-1"
          >
            Отклонить
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!readTerms}
            className="flex-1 bg-primary"
          >
            Принять
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

