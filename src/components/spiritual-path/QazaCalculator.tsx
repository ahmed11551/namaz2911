// Калькулятор восполнения намазов (Каза) для модуля "Мой Духовный Путь"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calculator, CalendarIcon, Map, Plus, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI, localStorageAPI } from "@/lib/api";
import { calculatePrayerDebt } from "@/lib/prayer-calculator";
import type { QazaCalculation } from "@/types/spiritual-path";
import type { TravelPeriod } from "@/types/prayer-debt";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useUserData } from "@/hooks/useUserData";

export const QazaCalculator = () => {
  const { toast } = useToast();
  const { userData } = useUserData();
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [manualCount, setManualCount] = useState<number>(0);
  
  // Для авторасчета
  const [gender, setGender] = useState<"male" | "female">("male");
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [prayerStartDate, setPrayerStartDate] = useState<Date | undefined>(undefined);
  const [travelPeriods, setTravelPeriods] = useState<Array<{ start_date: Date; end_date: Date }>>([]);
  
  // Результаты
  const [calculation, setCalculation] = useState<QazaCalculation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Если есть данные пользователя, используем их для авторасчета
    if (userData?.personal_data) {
      setGender(userData.personal_data.gender);
      setBirthDate(userData.personal_data.birth_date);
      setPrayerStartDate(userData.personal_data.prayer_start_date);
      if (userData.travel_data?.travel_periods) {
        setTravelPeriods(
          userData.travel_data.travel_periods.map((p: TravelPeriod | { start_date: string | Date; end_date: string | Date }) => ({
            start_date: p.start_date instanceof Date ? p.start_date : new Date(p.start_date),
            end_date: p.end_date instanceof Date ? p.end_date : new Date(p.end_date),
          }))
        );
      }
    }
  }, [userData]);

  const handleManualCalculate = () => {
    if (manualCount <= 0) {
      toast({
        title: "Ошибка",
        description: "Введите количество намазов",
        variant: "destructive",
      });
      return;
    }

    setCalculation({
      mode: "manual",
      manual_count: manualCount,
      total_debt: manualCount,
      debt_map: {},
    });
  };

  const handleAutoCalculate = async () => {
    if (!birthDate || !prayerStartDate) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const personalData = {
        birth_date: birthDate,
        gender,
        bulugh_age: 15,
        bulugh_date: new Date(birthDate.getFullYear() + 15, birthDate.getMonth(), birthDate.getDate()),
        prayer_start_date: prayerStartDate,
        today_as_start: false,
      };

      const womenData = gender === "female" ? {
        haid_days_per_month: 5,
        childbirth_count: 0,
        nifas_days_per_childbirth: 40,
      } : undefined;

      const travelData = {
        total_travel_days: travelPeriods.reduce((sum, p) => {
          const days = Math.ceil((p.end_date.getTime() - p.start_date.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0),
        travel_periods: travelPeriods,
      };

      const debtCalculation = calculatePrayerDebt(personalData, womenData, travelData, "hanafi");
      
      // Создаем карту долга
      const debtMap: Record<string, "debt" | "completed" | "none"> = {};
      const startDate = personalData.bulugh_date;
      const endDate = prayerStartDate;
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i < totalDays; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = format(date, "yyyy-MM-dd");
        debtMap[dateKey] = "debt";
      }

      const totalDebt = Object.values(debtCalculation.missed_prayers).reduce((sum, val) => sum + val, 0) +
        Object.values(debtCalculation.travel_prayers).reduce((sum, val) => sum + val, 0);

      setCalculation({
        mode: "auto",
        gender,
        birth_date: birthDate,
        prayer_start_date: prayerStartDate,
        travel_periods: travelPeriods,
        total_debt: totalDebt,
        debt_map: debtMap,
      });

      toast({
        title: "Расчет выполнен",
        description: `Общий долг: ${totalDebt} намазов`,
      });
    } catch (error) {
      console.error("Error calculating qaza:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось рассчитать долг",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!calculation || !calculation.total_debt) {
      toast({
        title: "Ошибка",
        description: "Сначала выполните расчет",
        variant: "destructive",
      });
      return;
    }

    try {
      // Создаем цель через утилиту синхронизации
      const { createQazaGoalIfNeeded } = await import("@/lib/qaza-goals-sync");
      const userId = userData?.user_id || "";
      await createQazaGoalIfNeeded(calculation.total_debt, userId);

      toast({
        title: "Цель создана!",
        description: "Теперь вы можете отслеживать прогресс восполнения",
      });
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать цель",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-1">
          <Calculator className="w-6 h-6 text-primary" />
          Калькулятор восполнения намазов (Каза)
        </h2>
        <p className="text-sm text-muted-foreground">
          Рассчитайте долг по намазам и создайте цель для восполнения
        </p>
      </div>

      <Tabs value={mode} onValueChange={(v) => setMode(v as "manual" | "auto")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Ручной ввод</TabsTrigger>
          <TabsTrigger value="auto">Авторасчет</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ручной ввод количества</CardTitle>
              <CardDescription>
                Введите количество намазов, которые нужно восполнить
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manualCount">Количество намазов</Label>
                <Input
                  id="manualCount"
                  type="number"
                  min={0}
                  value={manualCount}
                  onChange={(e) => setManualCount(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <Button onClick={handleManualCalculate} className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Рассчитать
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Авторасчет на основе данных</CardTitle>
              <CardDescription>
                Расчет на основе пола, даты рождения и даты начала практики
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Пол</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={gender === "male" ? "default" : "outline"}
                      onClick={() => setGender("male")}
                      className="flex-1"
                    >
                      Мужской
                    </Button>
                    <Button
                      variant={gender === "female" ? "default" : "outline"}
                      onClick={() => setGender("female")}
                      className="flex-1"
                    >
                      Женский
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm leading-tight break-words">Дата рождения</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          "overflow-hidden text-ellipsis whitespace-nowrap",
                          !birthDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {birthDate ? format(birthDate, "dd.MM.yyyy") : "Выберите дату"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={birthDate}
                        onSelect={setBirthDate}
                        initialFocus
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm leading-tight break-words">Дата начала практики намаза</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          "overflow-hidden text-ellipsis whitespace-nowrap",
                          !prayerStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">
                          {prayerStartDate ? format(prayerStartDate, "dd.MM.yyyy") : "Выберите дату"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={prayerStartDate}
                        onSelect={setPrayerStartDate}
                        initialFocus
                        disabled={(date) => date > new Date() || (birthDate && date < birthDate)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button 
                onClick={handleAutoCalculate} 
                className="w-full"
                disabled={loading}
              >
                <Calculator className="w-4 h-4 mr-2" />
                {loading ? "Расчет..." : "Рассчитать"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Результаты расчета */}
      {calculation && calculation.total_debt !== undefined && (
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" />
              Результаты расчета
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-6 bg-primary/10 rounded-lg border border-primary/20">
              <div className="text-4xl font-bold gradient-text mb-2">
                {calculation.total_debt}
              </div>
              <div className="text-muted-foreground">намазов к восполнению</div>
            </div>

            {calculation.debt_map && Object.keys(calculation.debt_map).length > 0 && (
              <div className="space-y-2">
                <Label>Карта долга</Label>
                <div className="p-4 bg-secondary/50 rounded-lg border border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">
                    Календарь с отмеченными днями долга будет доступен после создания цели
                  </p>
                  <div className="flex gap-2 items-center">
                    <div className="w-4 h-4 bg-red-500 rounded" />
                    <span className="text-sm">Дни с долгом</span>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleCreateGoal} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Создать цель для восполнения
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Кнопка перехода в калькулятор */}
      <Card className="bg-secondary/50 border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold mb-1">Нужен более детальный расчет?</p>
              <p className="text-sm text-muted-foreground">
                Используйте полный калькулятор с учетом всех параметров
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              Перейти в калькулятор
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

