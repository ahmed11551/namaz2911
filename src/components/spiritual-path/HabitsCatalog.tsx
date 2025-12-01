// Каталог готовых привычек

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Sparkles } from "lucide-react";
import { HabitCard } from "./HabitCard";
import { HabitDetailsDialog } from "./HabitDetailsDialog";
import {
  HABITS_CATALOG,
  getHabitsByFilter,
  getHabitsForBeginners,
  getHabitsForWomen,
  getHabitsForYouth,
  searchHabits,
  type Habit,
  type HabitFilter,
} from "@/data/habits-catalog";
import { cn } from "@/lib/utils";

interface HabitsCatalogProps {
  onAddHabit: (habit: Habit) => void;
  onCreateCustom?: () => void;
}

const FILTER_TABS: { value: HabitFilter | "beginners" | "women" | "youth"; label: string; icon?: string }[] = [
  { value: "all", label: "Все" },
  { value: "recommended", label: "⭐ Рекомендуем" },
  { value: "daily", label: "🕋 Ежедневные" },
  { value: "beginners", label: "🌱 Для начинающих" },
  { value: "ramadan", label: "🌙 Рамадан" },
  { value: "good_deeds", label: "💰 Добрые дела" },
  { value: "learning", label: "📚 Обучение" },
  { value: "prayer", label: "🕌 Намаз" },
  { value: "quran", label: "📖 Коран" },
  { value: "zikr", label: "📿 Зикр" },
  { value: "sadaqa", label: "💰 Садака" },
  { value: "knowledge", label: "📚 Знания" },
  { value: "fasting", label: "🌙 Пост" },
  { value: "etiquette", label: "💖 Этикет" },
];

export const HabitsCatalog = ({ onAddHabit, onCreateCustom }: HabitsCatalogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<HabitFilter | "beginners" | "women" | "youth">("all");
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Фильтрация привычек
  const filteredHabits = useMemo(() => {
    if (searchQuery.trim()) {
      return searchHabits(searchQuery);
    }
    if (selectedFilter === "beginners") {
      return getHabitsForBeginners();
    }
    if (selectedFilter === "women") {
      return getHabitsForWomen();
    }
    if (selectedFilter === "youth") {
      return getHabitsForYouth();
    }
    return getHabitsByFilter(selectedFilter as HabitFilter);
  }, [searchQuery, selectedFilter]);

  const handleAddHabit = (habit: Habit) => {
    onAddHabit(habit);
  };

  const handleShowDetails = (habit: Habit) => {
    setSelectedHabit(habit);
    setDetailsOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Заголовок и поиск */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              Каталог привычек
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Выберите готовую привычку или создайте свою
            </p>
          </div>
          {onCreateCustom && (
            <Button
              onClick={onCreateCustom}
              size="sm"
              variant="outline"
              className="rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Своя привычка</span>
              <span className="sm:hidden">Своя</span>
            </Button>
          )}
        </div>

        {/* Поиск */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="🔍 Найти вдохновение: поиск по каталогу привычек..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      </div>

      {/* Фильтры (чипы) */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2 -mx-1 px-1 scrollbar-hide">
          {FILTER_TABS.map((tab) => (
            <Button
              key={tab.value}
              onClick={() => {
                setSelectedFilter(tab.value);
                setSearchQuery(""); // Очищаем поиск при смене фильтра
              }}
              variant={selectedFilter === tab.value ? "default" : "outline"}
              size="sm"
              className={cn(
                "rounded-full whitespace-nowrap text-xs sm:text-sm",
                selectedFilter === tab.value && "shadow-md"
              )}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* Список привычек */}
      <div className="space-y-3">
        {filteredHabits.length > 0 ? (
          <>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Найдено: {filteredHabits.length} {filteredHabits.length === 1 ? "привычка" : "привычек"}
            </p>
            <ScrollArea className="h-[calc(100vh-400px)] sm:h-[calc(100vh-350px)]">
              <div className="space-y-3 pr-4">
                {filteredHabits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onAdd={handleAddHabit}
                    onInfo={handleShowDetails}
                  />
                ))}
              </div>
            </ScrollArea>
            
            {/* Мотивационное сообщение */}
            <div className="text-center pt-4 border-t border-border/50">
              <p className="text-xs sm:text-sm text-muted-foreground italic">
                "Каждое доброе действие — привычка сердца. Начни сегодня."
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-2">
              {searchQuery ? "Ничего не найдено" : "Нет привычек в этой категории"}
            </p>
            {searchQuery ? (
              <Button
                onClick={() => setSearchQuery("")}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Очистить поиск
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                В каталоге более 60 готовых привычек для духовного роста
              </p>
            )}
          </div>
        )}
      </div>

      {/* Диалог с деталями привычки */}
      {selectedHabit && (
        <HabitDetailsDialog
          habit={selectedHabit}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          onAdd={() => {
            handleAddHabit(selectedHabit);
            setDetailsOpen(false);
          }}
        />
      )}
    </div>
  );
};

