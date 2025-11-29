// Компонент для создания цели

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Target, Sparkles, Check } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { spiritualPathAPI } from "@/lib/api";
import { ItemSelector } from "./ItemSelector";
import { Checkbox } from "@/components/ui/checkbox";
import type { Goal, GoalCategory, GoalType, GoalPeriod, GoalMetric, KnowledgeSubcategory, LinkedCounterType } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";

interface CreateGoalDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onGoalCreated?: () => void;
  children?: ReactNode;
}

const CATEGORIES: Array<{ value: GoalCategory; label: string; icon: string }> = [
  { value: "prayer", label: "Намаз", icon: "🕌" },
  { value: "quran", label: "Коран", icon: "📖" },
  { value: "zikr", label: "Зикр/Дуа", icon: "📿" },
  { value: "sadaqa", label: "Садака", icon: "💝" },
  { value: "knowledge", label: "Знания", icon: "📚" },
  { value: "names_of_allah", label: "99 имен Аллаха", icon: "✨" },
];

const KNOWLEDGE_SUBCATEGORIES: Array<{ value: KnowledgeSubcategory; label: string }> = [
  { value: "book", label: "Книга" },
  { value: "alifba", label: "Уроки алифба" },
  { value: "tajwid", label: "Таджвид" },
];

const GOAL_TYPES: Array<{ value: GoalType; label: string; description?: string }> = [
  { value: "one_time", label: "Одноразовая", description: "Цель выполняется один раз" },
  { value: "recurring", label: "Повторяющаяся", description: "Автоматически возобновляется после завершения" },
  { value: "fixed_term", label: "С фиксированным сроком", description: "Цель с конкретной датой окончания" },
  { value: "habit", label: "Бессрочная привычка", description: "Ежедневная практика без срока" },
];

const PERIODS: Array<{ value: GoalPeriod; label: string }> = [
  { value: "infinite", label: "Бессрочная" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "forty_days", label: "40 дней" },
  { value: "year", label: "Год" },
  { value: "custom", label: "Произвольная дата" },
];

const METRICS: Array<{ value: GoalMetric; label: string }> = [
  { value: "count", label: "Количество (раз, страниц, сур)" },
  { value: "regularity", label: "Регулярность (дни подряд)" },
];

const LINKED_COUNTER_TYPES: Array<{ value: LinkedCounterType; label: string }> = [
  { value: "salawat", label: "Салаваты" },
  { value: "tasbih", label: "Тасбих (Субханаллах)" },
  { value: "tahmid", label: "Тахмид (Альхамдулиллах)" },
  { value: "takbir", label: "Такбир (Аллаху Акбар)" },
  { value: "names_of_allah", label: "99 имен Аллаха" },
];

export const CreateGoalDialog = ({ open, onOpenChange, onGoalCreated, children }: CreateGoalDialogProps) => {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange! : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory | "">("");
  const [knowledgeSubcategory, setKnowledgeSubcategory] = useState<KnowledgeSubcategory | "">("");
  const [type, setType] = useState<GoalType>("fixed_term");
  const [period, setPeriod] = useState<GoalPeriod>("month");
  const [metric, setMetric] = useState<GoalMetric>("count");
  const [targetValue, setTargetValue] = useState<number>(30);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [linkedCounterType, setLinkedCounterType] = useState<LinkedCounterType | "">("");
  const [isLearning, setIsLearning] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [selectedItemType, setSelectedItemType] = useState<Goal["item_type"]>(undefined);
  const [selectedItemData, setSelectedItemData] = useState<Goal["item_data"]>(null);

  // Автоматический расчет end_date на основе period
  const calculateEndDate = (period: GoalPeriod, start: Date): Date | null => {
    // Для бессрочных и повторяющихся целей дата окончания не устанавливается
    if (period === "infinite" || period === "recurring_weekly" || period === "recurring_monthly") {
      return null;
    }

    const end = new Date(start);
    switch (period) {
      case "week":
        end.setDate(end.getDate() + 7);
        break;
      case "month":
        end.setMonth(end.getMonth() + 1);
        break;
      case "forty_days":
        end.setDate(end.getDate() + 40);
        break;
      case "year":
        end.setFullYear(end.getFullYear() + 1);
        break;
      case "custom":
        return endDate || null;
    }
    return end;
  };

  // Расчет рекомендуемого ежедневного плана
  const calculateDailyPlan = (): number | null => {
    // Для бессрочных привычек план не рассчитывается
    if (type === "habit" || period === "infinite") return null;
    
    if (!startDate || !endDate || !targetValue) return null;
    const daysRemaining = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining <= 0) return null;
    return Math.ceil(targetValue / daysRemaining);
  };

  const handlePeriodChange = (newPeriod: GoalPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod === "infinite" || newPeriod === "recurring_weekly" || newPeriod === "recurring_monthly") {
      setEndDate(undefined);
    } else if (newPeriod !== "custom") {
      const calculatedEnd = calculateEndDate(newPeriod, startDate);
      setEndDate(calculatedEnd || undefined);
    }
  };

  const handleTypeChange = (newType: GoalType) => {
    setType(newType);
    // Автоматически устанавливаем период для бессрочных привычек
    if (newType === "habit") {
      setPeriod("infinite");
      setEndDate(undefined);
    } else if (newType === "recurring") {
      // Для повторяющихся целей предлагаем повторяющиеся периоды
      if (period !== "recurring_weekly" && period !== "recurring_monthly") {
        setPeriod("recurring_weekly");
        setEndDate(undefined);
      }
    }
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      setStartDate(date);
      if (period !== "custom") {
        setEndDate(calculateEndDate(period, date));
      }
    }
  };

  const handleSubmit = async () => {
    setShowErrors(true);
    
    // Детальная валидация с указанием конкретного поля
    const missingFields: string[] = [];
    
    if (!title.trim()) {
      missingFields.push("Название цели");
    }
    if (!category) {
      missingFields.push("Категория");
    }
    if (!targetValue || targetValue <= 0) {
      missingFields.push("Целевое значение");
    }
    
    if (missingFields.length > 0) {
      toast({
        title: "Заполните обязательные поля",
        description: missingFields.join(", "),
        variant: "destructive",
      });
      return;
    }

    if (category === "knowledge" && !knowledgeSubcategory) {
      toast({
        title: "Ошибка",
        description: "Выберите подкатегорию для категории 'Знания'",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const finalEndDate = period === "custom" ? endDate : calculateEndDate(period, startDate);
      if (!finalEndDate) {
        throw new Error("Необходимо указать дату окончания");
      }

      const dailyPlan = calculateDailyPlan();

      // Формируем название цели на основе выбранного элемента
      let finalTitle = title;
      if (selectedItemData && selectedItemData.title) {
        finalTitle = isLearning ? `Выучить ${selectedItemData.title}` : selectedItemData.title;
      } else if (isLearning && title) {
        finalTitle = `Выучить ${title}`;
      }

      await spiritualPathAPI.createGoal({
        title: finalTitle,
        description: description || selectedItemData?.translation || undefined,
        category: category as GoalCategory,
        knowledge_subcategory: category === "knowledge" ? (knowledgeSubcategory as KnowledgeSubcategory) : undefined,
        type,
        period,
        metric,
        target_value: targetValue,
        current_value: 0,
        start_date: startDate,
        end_date: finalEndDate,
        linked_counter_type: linkedCounterType || undefined,
        status: "active",
        daily_plan: dailyPlan || undefined,
        // Сохраняем данные элемента
        item_id: selectedItemId || undefined,
        item_type: selectedItemType,
        item_data: selectedItemData || undefined,
        is_learning: isLearning,
      });

      toast({
        title: "Цель создана!",
        description: dailyPlan ? `Рекомендуемый ежедневный план: ${Math.ceil(dailyPlan)}` : undefined,
      });

      // Сброс формы
      setTitle("");
      setDescription("");
      setCategory("");
      setKnowledgeSubcategory("");
      setTargetValue(30);
      setStartDate(new Date());
      setEndDate(undefined);
      setLinkedCounterType("");
      setShowErrors(false);
      setIsLearning(false);
      setSelectedItemId("");
      setSelectedItemType(undefined);
      setSelectedItemData(null);

      // Отправляем событие для синхронизации других страниц
      window.dispatchEvent(new CustomEvent('goalsUpdated'));
      
      onOpenChange(false);
      onGoalCreated?.();
    } catch (error) {
      console.error("Error creating goal:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать цель. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const dailyPlan = calculateDailyPlan();

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Создать цель
          </DialogTitle>
          <DialogDescription>
            Установите цель для отслеживания вашего духовного роста
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Название цели */}
          <div className="space-y-2">
            <Label htmlFor="title" className={cn(showErrors && !title.trim() && "text-red-500")}>
              Название цели *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Прочитать весь Коран"
              className={cn(showErrors && !title.trim() && "border-red-300 bg-red-50")}
            />
          </div>

          {/* Описание */}
          <div className="space-y-2">
            <Label htmlFor="description">Описание (необязательно)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Добавьте описание цели..."
              rows={3}
            />
          </div>

          {/* Категория */}
          <div className="space-y-2">
            <Label className={cn(showErrors && !category && "text-red-500")}>
              Категория * {showErrors && !category && <span className="text-red-500 text-xs ml-1">(выберите)</span>}
            </Label>
            <div className={cn(
              "grid grid-cols-3 gap-2 p-2 rounded-lg transition-colors",
              showErrors && !category && "bg-red-50 border-2 border-red-300"
            )}>
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.value}
                  type="button"
                  variant={category === cat.value ? "default" : "outline"}
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    "h-auto py-3 flex flex-col gap-1",
                    category === cat.value && "ring-2 ring-emerald-500"
                  )}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs">{cat.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Подкатегория для знаний */}
          {category === "knowledge" && (
            <div className="space-y-2">
              <Label>Подкатегория *</Label>
              <Select value={knowledgeSubcategory} onValueChange={(v) => setKnowledgeSubcategory(v as KnowledgeSubcategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите подкатегорию" />
                </SelectTrigger>
                <SelectContent>
                  {KNOWLEDGE_SUBCATEGORIES.map((sub) => (
                    <SelectItem key={sub.value} value={sub.value}>
                      {sub.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Выбор конкретного элемента для зикров, корана, намазов */}
          {(category === "zikr" || category === "quran" || category === "prayer" || category === "names_of_allah") && (
            <div className="space-y-2">
              <Label>Выберите конкретный элемент</Label>
              <ItemSelector
                category={category as GoalCategory}
                selectedItemId={selectedItemId}
                selectedItemType={selectedItemType}
                onItemSelect={(itemId, itemType, itemData) => {
                  setSelectedItemId(itemId);
                  setSelectedItemType(itemType as Goal["item_type"]);
                  setSelectedItemData(itemData as Goal["item_data"]);
                  // Автоматически заполняем название и описание
                  if (itemData.title) {
                    setTitle(itemData.title);
                  }
                  if (itemData.translation) {
                    setDescription(itemData.translation);
                  }
                }}
              />
            </div>
          )}

          {/* Флаг "Выучить" */}
          {(category === "zikr" || category === "quran" || category === "names_of_allah") && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-learning"
                checked={isLearning}
                onCheckedChange={(checked) => setIsLearning(checked as boolean)}
              />
              <Label
                htmlFor="is-learning"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Выучить
              </Label>
              <p className="text-xs text-muted-foreground">
                Если отмечено, в тасбихе появится кнопка "Выучил"
              </p>
            </div>
          )}

          {/* Тип цели */}
          <div className="space-y-2">
            <Label>Тип цели</Label>
            <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Период */}
          <div className="space-y-2">
            <Label>Период</Label>
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Метрика */}
          <div className="space-y-2">
            <Label>Метрика</Label>
            <Select value={metric} onValueChange={(v) => setMetric(v as GoalMetric)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METRICS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Целевое значение */}
          <div className="space-y-2">
            <Label htmlFor="targetValue">Целевое значение *</Label>
            <Input
              id="targetValue"
              type="number"
              min={1}
              value={targetValue}
              onChange={(e) => setTargetValue(parseInt(e.target.value) || 0)}
              placeholder="30"
            />
            <p className="text-xs text-muted-foreground">
              {metric === "count" ? "Количество (раз, страниц, сур и т.д.)" : "Количество дней подряд"}
            </p>
          </div>

          {/* Даты */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm leading-tight break-words">Дата начала</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      "overflow-hidden text-ellipsis whitespace-nowrap",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {startDate ? format(startDate, "dd.MM.yyyy") : "Выберите дату"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={handleStartDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-sm leading-tight break-words">
                Дата окончания {period === "custom" && "*"}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      "overflow-hidden text-ellipsis whitespace-nowrap",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {endDate ? format(endDate, "dd.MM.yyyy") : "Выберите дату"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Интеграция с тасбихом */}
          {(category === "zikr" || category === "names_of_allah") && (
            <div className="space-y-2">
              <Label>Интеграция с тасбихом (необязательно)</Label>
              <Select
                value={linkedCounterType || ""}
                onValueChange={(v) => setLinkedCounterType(v as LinkedCounterType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип счетчика" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Не использовать</SelectItem>
                  {LINKED_COUNTER_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value || ""}>
                      {ct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Если выбран, прогресс будет автоматически синхронизироваться с тасбихом
              </p>
            </div>
          )}

          {/* Рекомендуемый ежедневный план */}
          {dailyPlan && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Рекомендуемый ежедневный план</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Для достижения цели делайте <strong className="text-primary">{Math.ceil(dailyPlan)}</strong>{" "}
                {metric === "count" ? "в день" : "дней подряд"}
              </p>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Создание..." : "Создать цель"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

