// Компонент для ручного ввода пропущенных намазов

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { prayerDebtAPI, localStorageAPI } from "@/lib/api";
import { getTelegramUserId } from "@/lib/telegram";
import { logCalculation } from "@/lib/audit-log";
import type { MissedPrayers, TravelPrayers } from "@/types/prayer-debt";

export const ManualInputSection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Состояние для пропущенных намазов
  const [missedPrayers, setMissedPrayers] = useState<MissedPrayers>({
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
    witr: 0,
  });

  // Состояние для сафар-намазов
  const [travelPrayers, setTravelPrayers] = useState<TravelPrayers>({
    dhuhr_safar: 0,
    asr_safar: 0,
    isha_safar: 0,
  });

  const handlePrayerChange = (prayer: keyof MissedPrayers, value: number) => {
    setMissedPrayers((prev) => ({
      ...prev,
      [prayer]: Math.max(0, value),
    }));
  };

  const handleTravelPrayerChange = (prayer: keyof TravelPrayers, value: number) => {
    setTravelPrayers((prev) => ({
      ...prev,
      [prayer]: Math.max(0, value),
    }));
  };

  const handleSave = async () => {
    setErrors([]);
    setLoading(true);

    try {
      // Валидация
      const totalMissed = Object.values(missedPrayers).reduce((sum, val) => sum + val, 0);
      const totalTravel = Object.values(travelPrayers).reduce((sum, val) => sum + val, 0);

      if (totalMissed === 0 && totalTravel === 0) {
        setErrors(["Пожалуйста, укажите хотя бы одно пропущенное намаз"]);
        setLoading(false);
        return;
      }

      // Создаем объект данных
      const telegramUserId = getTelegramUserId();
      const userData = {
        user_id: telegramUserId || `user_${Date.now()}`,
        calc_version: "1.0.0",
        madhab: "hanafi" as const,
        calculation_method: "manual" as const,
        personal_data: {
          birth_date: new Date(),
          gender: "male" as const,
          bulugh_age: 15,
          bulugh_date: new Date(),
          prayer_start_date: new Date(),
          today_as_start: true,
        },
        debt_calculation: {
          period: {
            start: new Date(),
            end: new Date(),
          },
          total_days: 0,
          excluded_days: 0,
          effective_days: 0,
          missed_prayers: missedPrayers,
          travel_prayers: travelPrayers,
        },
        repayment_progress: {
          completed_prayers: {
            fajr: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0,
            witr: 0,
          },
          last_updated: new Date(),
        },
      };

      // Попытка сохранить через API
      try {
        const response = await prayerDebtAPI.calculateDebt({
          calculation_method: "manual",
          missed_prayers: missedPrayers,
          travel_prayers: travelPrayers,
        });
        
        // Если API вернул данные, обновляем userData
        if (response && response.debt_calculation) {
          localStorageAPI.saveUserData(response);
        } else {
          localStorageAPI.saveUserData(userData);
        }
      } catch (apiError) {
        console.warn("API недоступен, сохраняем локально:", apiError);
        localStorageAPI.saveUserData(userData);
      }

      // Логирование
      const userId = telegramUserId || userData.user_id;
      logCalculation(userId, null, userData.debt_calculation);

      toast({
        title: "Данные сохранены",
        description: `Сохранено ${totalMissed.toLocaleString()} пропущенных намазов и ${totalTravel.toLocaleString()} сафар-намазов.`,
      });

      // Обновляем данные через событие
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка при сохранении",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalMissed = Object.values(missedPrayers).reduce((sum, val) => sum + val, 0);
  const totalTravel = Object.values(travelPrayers).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <Card className="bg-gradient-card shadow-medium border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary" />
            Ручной ввод пропущенных намазов
          </CardTitle>
          <CardDescription>
            Если вы знаете точное количество пропущенных намазов, введите их вручную
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Missed Prayers */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Пропущенные обязательные намазы</CardTitle>
          <CardDescription>
            Укажите количество пропущенных намазов по каждому виду
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "fajr" as const, label: "Фаджр", emoji: "🌅" },
            { key: "dhuhr" as const, label: "Зухр", emoji: "☀️" },
            { key: "asr" as const, label: "Аср", emoji: "🌤️" },
            { key: "maghrib" as const, label: "Магриб", emoji: "🌇" },
            { key: "isha" as const, label: "Иша", emoji: "🌙" },
            { key: "witr" as const, label: "Витр", emoji: "✨" },
          ].map(({ key, label, emoji }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-sm font-medium flex items-center gap-2">
                <span>{emoji}</span>
                <span>{label}</span>
              </Label>
              <Input
                id={key}
                type="number"
                min={0}
                value={missedPrayers[key]}
                onChange={(e) => handlePrayerChange(key, parseInt(e.target.value) || 0)}
                className="bg-background"
                placeholder="0"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Travel Prayers */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Сафар-намазы (путешествия)</CardTitle>
          <CardDescription>
            Укажите количество сокращенных намазов во время путешествий
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "dhuhr_safar" as const, label: "Зухр (сафар)", emoji: "☀️" },
            { key: "asr_safar" as const, label: "Аср (сафар)", emoji: "🌤️" },
            { key: "isha_safar" as const, label: "Иша (сафар)", emoji: "🌙" },
          ].map(({ key, label, emoji }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="text-sm font-medium flex items-center gap-2">
                <span>{emoji}</span>
                <span>{label}</span>
              </Label>
              <Input
                id={key}
                type="number"
                min={0}
                value={travelPrayers[key]}
                onChange={(e) => handleTravelPrayerChange(key, parseInt(e.target.value) || 0)}
                className="bg-background"
                placeholder="0"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary */}
      {(totalMissed > 0 || totalTravel > 0) && (
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Итого:</span>
              </div>
              <div className="pl-7 space-y-1 text-sm">
                <div>
                  Пропущенных намазов: <strong>{totalMissed.toLocaleString("ru-RU")}</strong>
                </div>
                <div>
                  Сафар-намазов: <strong>{totalTravel.toLocaleString("ru-RU")}</strong>
                </div>
                <div className="pt-2 text-base font-semibold">
                  Всего: <strong>{(totalMissed + totalTravel).toLocaleString("ru-RU")}</strong>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={loading || (totalMissed === 0 && totalTravel === 0)}
        size="lg"
        className="w-full bg-primary hover:opacity-90"
      >
        {loading ? "Сохранение..." : "Сохранить данные"}
      </Button>
    </div>
  );
};

