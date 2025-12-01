// Калькулятор каза - дизайн Fintrack (тёмная тема)

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, User, Plane, AlertCircle, CheckSquare, ChevronRight, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateBulughDate, calculatePrayerDebt, validateCalculationData } from "@/lib/prayer-calculator";
import { prayerDebtAPI, localStorageAPI } from "@/lib/api";
import { getTelegramUserId } from "@/lib/telegram";
import { logCalculation } from "@/lib/audit-log";
import type { Gender, Madhab, TravelPeriod } from "@/types/prayer-debt";
import { TravelPeriodsDialog } from "./TravelPeriodsDialog";
import { ManualInputSection } from "./ManualInputSection";
import { cn } from "@/lib/utils";

type CalculatorMode = "choice" | "manual" | "calculator";

export const CalculatorSection = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<CalculatorMode>("choice");
  const [gender, setGender] = useState<Gender>("male");
  const [madhab, setMadhab] = useState<Madhab>("hanafi");
  const [useTodayAsStart, setUseTodayAsStart] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Form state
  const [birthDate, setBirthDate] = useState("");
  const [bulughAge, setBulughAge] = useState(15);
  const [prayerStartDate, setPrayerStartDate] = useState("");
  const [haidDays, setHaidDays] = useState(7);
  const [childbirthCount, setChildbirthCount] = useState(0);
  const [nifasDays, setNifasDays] = useState(40);
  const [travelDays, setTravelDays] = useState(0);
  const [travelPeriods, setTravelPeriods] = useState<TravelPeriod[]>([]);
  const [travelPeriodsDialogOpen, setTravelPeriodsDialogOpen] = useState(false);

  const handleCalculate = async () => {
    setErrors([]);
    setLoading(true);

    try {
      if (!birthDate) {
        setErrors(["Пожалуйста, укажите дату рождения"]);
        setLoading(false);
        return;
      }

      const birthDateObj = new Date(birthDate);
      const bulughDate = calculateBulughDate(birthDateObj, bulughAge);
      const prayerStartDateObj = useTodayAsStart ? new Date() : new Date(prayerStartDate);

      if (!useTodayAsStart && !prayerStartDate) {
        setErrors(["Пожалуйста, укажите дату начала молитв"]);
        setLoading(false);
        return;
      }

      const personalData = {
        birth_date: birthDateObj,
        gender,
        bulugh_age: bulughAge,
        bulugh_date: bulughDate,
        prayer_start_date: prayerStartDateObj,
        today_as_start: useTodayAsStart,
      };

      const womenData = gender === "female" ? {
        haid_days_per_month: haidDays,
        childbirth_count: childbirthCount,
        nifas_days_per_childbirth: nifasDays,
      } : undefined;

      const calculatedTravelDays = travelPeriods.length > 0
        ? travelPeriods.reduce((sum, p) => sum + p.days_count, 0)
        : travelDays;

      const travelData = {
        total_travel_days: calculatedTravelDays,
        travel_periods: travelPeriods,
      };

      const validation = validateCalculationData(personalData, womenData, travelData);
      if (!validation.valid) {
        setErrors(validation.errors);
        setLoading(false);
        return;
      }

      const debtCalculation = calculatePrayerDebt(personalData, womenData, travelData, madhab);

      const telegramUserId = getTelegramUserId();
      const userData = {
        user_id: telegramUserId || `user_${Date.now()}`,
        calc_version: "1.0.0",
        madhab: madhab,
        calculation_method: "calculator" as const,
        personal_data: personalData,
        women_data: womenData,
        travel_data: travelData,
        debt_calculation: debtCalculation,
        repayment_progress: {
          completed_prayers: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 },
          last_updated: new Date(),
        },
      };

      try {
        const response = await prayerDebtAPI.calculateDebt({
          calculation_method: "calculator",
          personal_data: { ...personalData, bulugh_date: bulughDate },
          women_data: womenData,
          travel_data: travelData,
        });
        await localStorageAPI.saveUserData(response || userData);
      } catch {
        await localStorageAPI.saveUserData(userData);
      }

      logCalculation(telegramUserId || userData.user_id, null, debtCalculation);

      const totalMissed = Object.values(debtCalculation.missed_prayers).reduce((sum, val) => sum + val, 0);

      toast({
        title: "✅ Расчёт выполнен",
        description: `Найдено ${totalMissed.toLocaleString()} пропущенных намазов`,
      });

      window.dispatchEvent(new CustomEvent('userDataUpdated'));
    } catch (error) {
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Произошла ошибка",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Экран выбора режима - Fintrack style с анимациями
  if (mode === "choice") {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">Выберите способ расчёта</h2>
        
        <button
          onClick={() => setMode("manual")}
          className="w-full bg-card rounded-2xl p-6 sm:p-8 border border-border/50 hover:border-primary/30 transition-all flex items-center gap-4 text-left"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/20 flex items-center justify-center text-primary magnetic wiggle-hover shrink-0">
            <CheckSquare className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Я знаю количество</h3>
            <p className="text-sm text-muted-foreground mt-1">Введите пропущенные намазы вручную</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        <button
          onClick={() => setMode("calculator")}
          className="w-full bg-card rounded-2xl p-6 sm:p-8 border border-border/50 hover:border-primary/30 transition-all flex items-center gap-4 text-left"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary/20 flex items-center justify-center text-primary magnetic wiggle-hover shrink-0">
            <Calculator className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Помощь посчитать</h3>
            <p className="text-sm text-muted-foreground mt-1">Автоматический расчёт по дате рождения</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  // Режим ручного ввода
  if (mode === "manual") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setMode("choice")}
          className="flex items-center gap-2 text-primary font-medium mb-6"
        >
          ← Назад
        </button>
        <ManualInputSection />
      </div>
    );
  }

  // Режим калькулятора - Fintrack style
  return (
      <div className="space-y-6 sm:space-y-8">
      <button
        onClick={() => setMode("choice")}
        className="flex items-center gap-2 text-primary font-medium"
      >
        ← Назад
      </button>

      {/* Ошибки */}
      {errors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <ul className="text-sm text-destructive space-y-1">
              {errors.map((error, i) => <li key={i}>{error}</li>)}
            </ul>
          </div>
        </div>
      )}

      {/* Личные данные */}
      <div className="bg-card rounded-2xl p-5 border border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Личные данные</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Дата рождения</Label>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1 h-12 rounded-xl bg-secondary border-border/50"
            />
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Пол</Label>
            <div className="flex gap-3 mt-2">
              {[
                { value: "male", label: "Мужской" },
                { value: "female", label: "Женский" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGender(option.value as Gender)}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-medium transition-colors",
                    gender === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Мазхаб</Label>
            <Select value={madhab} onValueChange={(v) => setMadhab(v as Madhab)}>
              <SelectTrigger className="mt-1 h-12 rounded-xl bg-secondary border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50">
                <SelectItem value="hanafi">Ханафитский</SelectItem>
                <SelectItem value="shafii">Шафиитский</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground">Возраст булюга</Label>
            <Input
              type="number"
              value={bulughAge}
              onChange={(e) => setBulughAge(parseInt(e.target.value) || 15)}
              min={12}
              max={18}
              className="mt-1 h-12 rounded-xl bg-secondary border-border/50"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <Label className="text-sm text-muted-foreground">Молюсь с сегодняшнего дня</Label>
            <Switch checked={useTodayAsStart} onCheckedChange={setUseTodayAsStart} />
          </div>

          {!useTodayAsStart && (
            <div>
              <Label className="text-sm text-muted-foreground">Дата начала молитв</Label>
              <Input
                type="date"
                value={prayerStartDate}
                onChange={(e) => setPrayerStartDate(e.target.value)}
                className="mt-1 h-12 rounded-xl bg-secondary border-border/50"
              />
            </div>
          )}
        </div>
      </div>

      {/* Данные для женщин */}
      {gender === "female" && (
        <div className="bg-card rounded-2xl p-5 border border-border/50">
          <h3 className="font-semibold text-foreground mb-4">Дополнительно</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Дней хайда в месяц</Label>
              <Input
                type="number"
                value={haidDays}
                onChange={(e) => setHaidDays(parseInt(e.target.value) || 7)}
                min={3}
                max={10}
                className="mt-1 h-12 rounded-xl bg-secondary border-border/50"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Количество родов</Label>
              <Input
                type="number"
                value={childbirthCount}
                onChange={(e) => setChildbirthCount(parseInt(e.target.value) || 0)}
                min={0}
                className="mt-1 h-12 rounded-xl bg-secondary border-border/50"
              />
            </div>
            {childbirthCount > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground">Дней нифаса на каждые роды</Label>
                <Input
                  type="number"
                  value={nifasDays}
                  onChange={(e) => setNifasDays(parseInt(e.target.value) || 40)}
                  min={1}
                  max={60}
                  className="mt-1 h-12 rounded-xl bg-secondary border-border/50"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Путешествия */}
      <div className="bg-card rounded-2xl p-5 border border-border/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">Путешествия (сафар)</h3>
        </div>

        {/* Информация о сафаре и позиции ДУМ */}
        <div className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-semibold text-foreground">О сафаре (путешествии)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>Сафар</strong> — это путешествие, при котором путник имеет право сокращать четырёхракаатные намазы 
                (Зухр, Аср, Иша) до двух ракаатов. Согласно ханафитскому мазхабу, минимальное расстояние для сафара составляет 
                около 90-100 км от места постоянного проживания.
              </p>
              <div className="mt-3 pt-3 border-t border-blue-500/20">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                  📋 Позиция ДУМ РФ по сафару:
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Согласно официальной позиции Духовного управления мусульман Российской Федерации, сафаром считается 
                  путешествие на расстояние не менее 90 км от места постоянного проживания. В период сафара путник 
                  имеет право сокращать четырёхракаатные намазы (Зухр, Аср, Иша) до двух ракаатов. Дни сафара исключаются 
                  из расчёта долга намазов, так как в эти дни намазы совершались в сокращённом виде.
                </p>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  *Расчёт выполнен по методике ханафитского мазхаба согласно позиции ДУМ РФ.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Общее количество дней в пути</Label>
            <Input
              type="number"
              value={travelDays}
              onChange={(e) => setTravelDays(parseInt(e.target.value) || 0)}
              min={0}
              className="mt-1 h-12 rounded-xl bg-secondary border-border/50"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Укажите общее количество дней, проведённых в путешествиях (сафар)
            </p>
          </div>

          <TravelPeriodsDialog
            periods={travelPeriods}
            onPeriodsChange={setTravelPeriods}
            open={travelPeriodsDialogOpen}
            onOpenChange={setTravelPeriodsDialogOpen}
          />

          <Button
            variant="outline"
            onClick={() => setTravelPeriodsDialogOpen(true)}
            className="w-full h-12 rounded-xl border-border/50 bg-secondary hover:bg-secondary/80"
          >
            Указать периоды путешествий ({travelPeriods.length})
          </Button>
        </div>
      </div>

      {/* Кнопка расчёта */}
      <Button
        onClick={handleCalculate}
        disabled={loading || !birthDate}
        className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg"
      >
        {loading ? "Расчёт..." : "Рассчитать долги"}
      </Button>
    </div>
  );
};
