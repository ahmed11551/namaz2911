// Умный Тасбих и Трекер Зикров (Версия 2.0)
// Согласно ТЗ: модуль с глубокой аналитикой, офлайн-режимом, ежедневными азкарами

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Undo2,
  Plus,
  Target,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFocusRituals } from "@/hooks/useFocusRituals";
import { smartTasbihAPI, eReplikaAPI, spiritualPathAPI } from "@/lib/api";
import { initOfflineQueue, addOfflineEvent, getUnsyncedEvents, syncOfflineEvents } from "@/lib/offline-queue";
import { getAvailableItemsByCategory, getNamesOfAllah } from "@/lib/dhikr-data";
import type { DhikrItem } from "@/lib/dhikr-data";
import type {
  Category,
  GoalType,
  PrayerSegment,
  TasbihGoal,
  TasbihSession,
  DailyAzkar,
  FocusMood,
  FocusRitual,
} from "@/types/smart-tasbih";
import type { Goal, LinkedCounterType } from "@/types/spiritual-path";
import { cn } from "@/lib/utils";
import { getMoodLabel } from "@/lib/focus-rituals";
import {
  loadFavoriteTasbihItems,
  loadPendingTasbih,
  removePendingTasbih,
  toggleFavoriteTasbihItem,
  upsertPendingTasbih,
} from "@/lib/tasbih-storage";
import { hapticFeedback, showTelegramNotification } from "@/lib/telegram";

interface SmartTasbihV2Props {
  goalId?: string;
}

const PRAYER_SEGMENTS: Array<{ value: PrayerSegment; label: string; icon: string }> = [
  { value: "fajr", label: "Фаджр", icon: "🌅" },
  { value: "dhuhr", label: "Зухр", icon: "☀️" },
  { value: "asr", label: "Аср", icon: "🌤️" },
  { value: "maghrib", label: "Магриб", icon: "🌆" },
  { value: "isha", label: "Иша", icon: "🌙" },
];

const MOOD_OPTIONS: Array<{ value: FocusMood; label: string; emoji: string }> = [
  { value: "calm", label: "Спокойствие", emoji: "🌿" },
  { value: "gratitude", label: "Благодарность", emoji: "🤲" },
  { value: "energy", label: "Энергия", emoji: "⚡" },
  { value: "healing", label: "Исцеление", emoji: "💧" },
  { value: "repentance", label: "Истигфар", emoji: "🕊️" },
];

type DhikrItemTypeKey = NonNullable<Goal["item_type"]>;

interface LastEvent {
  delta: number;
  value_after: number;
}

type GoalWithCategory = Goal & { item_category?: Category };

const mapCategoryToDhikrType = (category: Category): DhikrItemTypeKey | null => {
  switch (category) {
    case "dua":
      return "dua";
    case "azkar":
      return "adhkar";
    case "salawat":
      return "salawat";
    case "kalimat":
      return "kalima";
    case "names99":
      return "name_of_allah";
    case "surah":
      return "surah";
    case "ayah":
      return "ayah";
    default:
      return null;
  }
};

const mapGoalItemTypeToCategory = (itemType?: Goal["item_type"]): Category => {
  switch (itemType) {
    case "adhkar":
      return "azkar";
    case "salawat":
      return "salawat";
    case "kalima":
      return "kalimat";
    case "name_of_allah":
      return "names99";
    case "surah":
      return "surah";
    case "ayah":
      return "ayah";
    case "dua":
    default:
      return "dua";
  }
};

const mapGoalStatus = (status: Goal["status"]): TasbihGoal["status"] => {
  return status === "completed" ? "completed" : "active";
};

const getDailyCountForSegment = (record: DailyAzkar | null, segment: PrayerSegment): number => {
  if (!record) return 0;
  switch (segment) {
    case "fajr":
      return record.fajr;
    case "dhuhr":
      return record.dhuhr;
    case "asr":
      return record.asr;
    case "maghrib":
      return record.maghrib;
    case "isha":
      return record.isha;
    default:
      return 0;
  }
};

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatTimeAgo = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) {
    return `${Math.max(1, Math.round(diff / 1000))} c назад`;
  }
  if (diff < 3_600_000) {
    return `${Math.round(diff / 60_000)} мин назад`;
  }
  return `${Math.round(diff / 3_600_000)} ч назад`;
};

const formatJournalDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export const SmartTasbihV2 = ({ goalId }: SmartTasbihV2Props) => {
  const { toast } = useToast();
  const { rituals, saveCustom, journal, addJournalEntry } = useFocusRituals();
  const [loading, setLoading] = useState(true);
  const [activeGoal, setActiveGoal] = useState<TasbihGoal | null>(null);
  const [activeSession, setActiveSession] = useState<TasbihSession | null>(null);
  const [dailyAzkar, setDailyAzkar] = useState<DailyAzkar | null>(null);
  const [currentCount, setCurrentCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<Category>("dua");
  const [selectedItem, setSelectedItem] = useState<DhikrItem | null>(null);
  const [availableItems, setAvailableItems] = useState<DhikrItem[]>([]);
  const [lastEvent, setLastEvent] = useState<LastEvent | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [loadingItems, setLoadingItems] = useState(false);
  const [spiritualPathGoals, setSpiritualPathGoals] = useState<Goal[]>([]);
  const [sessionMood, setSessionMood] = useState<FocusMood>("calm");
  const [sessionReflection, setSessionReflection] = useState("");
  const [customRitualTitle, setCustomRitualTitle] = useState("");
  const [customRitualIntent, setCustomRitualIntent] = useState("");
  const [customRitualCount, setCustomRitualCount] = useState("33");
  const [customRitualMood, setCustomRitualMood] = useState<FocusMood>("gratitude");
  const [activeRitualId, setActiveRitualId] = useState<string | null>(null);
  const [ritualStepIndex, setRitualStepIndex] = useState(0);
  const [autoMode, setAutoMode] = useState(false);
  const [autoTempo, setAutoTempo] = useState(60);
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [recentEvents, setRecentEvents] = useState<
    Array<{ id: string; delta: number; timestamp: number; source: "manual" | "auto" | "bulk" }>
  >([]);
  const [favoriteItemIds, setFavoriteItemIds] = useState<string[]>(() => loadFavoriteTasbihItems());
  const [manualTarget, setManualTarget] = useState(33);
  const [manualPickerOpen, setManualPickerOpen] = useState<string | null>("manual");

  useEffect(() => {
    if (selectedItem?.count) {
      setManualTarget(selectedItem.count);
    }
  }, [selectedItem]);

  // Инициализация
  const loadSpiritualPathGoals = useCallback(async () => {
    try {
      const goals = await spiritualPathAPI.getGoals("active");
      setSpiritualPathGoals(goals);
      return goals;
    } catch (error) {
      console.error("Error loading spiritual path goals:", error);
      return [];
    }
  }, []);

  const init = useCallback(async () => {
    setLoading(true);
    try {
      await initOfflineQueue();

      const fetchedGoals = await loadSpiritualPathGoals();

      if (goalId) {
        try {
          const goal = fetchedGoals.find((g) => g.id === goalId);
          if (goal && goal.category === "zikr") {
            const tasbihGoal: TasbihGoal = {
              id: goal.id,
              category: mapGoalItemTypeToCategory(goal.item_type),
              item_id: goal.item_id,
              goal_type: "recite",
              target_count: goal.target_value || 33,
              progress: goal.current_value || 0,
              prayer_segment: "none",
            };
            setActiveGoal(tasbihGoal);
            await startSessionForGoal(tasbihGoal);
          }
        } catch (error) {
          console.error("Error loading goal by ID:", error);
        }
      }

      try {
        const bootstrap = await smartTasbihAPI.bootstrap();
        if (!goalId && bootstrap.active_goal) {
          setActiveGoal(bootstrap.active_goal);
          await startSessionForGoal(bootstrap.active_goal);
        }
        setDailyAzkar(bootstrap.daily_azkar || null);
      } catch (error) {
        console.error("Error bootstrapping:", error);
      }

      syncOfflineQueue().catch((err) => console.error("Error syncing offline queue:", err));
    } catch (error) {
      console.error("Error initializing:", error);
    } finally {
      setLoading(false);
    }
  }, [goalId, loadSpiritualPathGoals]);

  useEffect(() => {
    init();
  }, [init]);

  // Синхронизация офлайн-событий при восстановлении связи
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await syncOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Загрузка элементов категории
  useEffect(() => {
    if (!selectedCategory || selectedCategory === "general") {
      return;
    }
    loadCategoryItems(selectedCategory);
  }, [selectedCategory, loadCategoryItems]);

  const tasbihLinkedGoals = useMemo(
    () =>
      spiritualPathGoals.filter(
        (goal) =>
          goal.category === "zikr" ||
          goal.category === "names_of_allah" ||
          goal.category === "quran" ||
          goal.linked_counter_type
      ),
    [spiritualPathGoals]
  );

  const handleStartFromSpiritualGoal = async (goal: Goal) => {
    const goalWithCategory = goal as GoalWithCategory;
    const derivedCategory = goalWithCategory.item_category ?? mapGoalItemTypeToCategory(goal.item_type);
    const tasbihGoal: TasbihGoal = {
      id: goal.id,
      user_id: goal.user_id,
      category: derivedCategory,
      item_id: goal.item_id,
      goal_type: goal.metric === "count" ? "recite" : "learn",
      target_count: goal.target_value || 33,
      progress: goal.current_value || 0,
      status: mapGoalStatus(goal.status),
      prayer_segment: "none",
      created_at: goal.created_at,
      updated_at: goal.updated_at,
    };
    setActiveGoal(tasbihGoal);
    await startSessionForGoal(tasbihGoal);
  };

  // Определение типа счетчика на основе категории и элемента
  const getCounterType = (category: Category, item?: DhikrItem | null): LinkedCounterType => {
    if (category === "salawat") return "salawat";
    if (category === "azkar") {
      // Определяем по названию элемента
      const title = item?.title?.toLowerCase() || item?.translation?.toLowerCase() || "";
      if (title.includes("тасбих") || title.includes("субханаллах")) return "tasbih";
      if (title.includes("тахмид") || title.includes("альхамдулиллах")) return "tahmid";
      if (title.includes("такбир") || title.includes("аллаху акбар")) return "takbir";
      return "tasbih"; // По умолчанию
    }
    return null;
  };

  // Получение связанных целей для текущего типа счетчика
  const linkedGoals = useMemo(() => {
    if (!selectedCategory || !selectedItem) return [];
    const counterType = getCounterType(selectedCategory, selectedItem);
    if (!counterType) return [];
    return spiritualPathGoals.filter(g => g.linked_counter_type === counterType);
  }, [selectedCategory, selectedItem, spiritualPathGoals]);

  const activeRitual = useMemo(
    () => rituals.find((ritual) => ritual.id === activeRitualId) || null,
    [rituals, activeRitualId]
  );

  const loadCategoryItems = useCallback(async (category: Category) => {
    setLoadingItems(true);
    try {
      let items: DhikrItem[] = [];
      switch (category) {
        case "dua":
          items = await getAvailableItemsByCategory("dua");
          break;
        case "azkar":
          items = await getAvailableItemsByCategory("adhkar");
          break;
        case "salawat":
          items = await getAvailableItemsByCategory("salawat");
          break;
        case "kalimat":
          items = await getAvailableItemsByCategory("kalima");
          break;
        case "names99":
          items = await getNamesOfAllah();
          break;
        default:
          items = [];
      }
      setAvailableItems(items);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  const syncOfflineQueue = async () => {
    try {
      const unsyncedEvents = await getUnsyncedEvents();
      if (unsyncedEvents.length > 0) {
        await smartTasbihAPI.syncOfflineEvents(unsyncedEvents);
      }
    } catch (error) {
      console.error("Error syncing offline queue:", error);
    }
  };

  const startSessionForGoal = async (goal: TasbihGoal) => {
    try {
      const session = await smartTasbihAPI.startSession({
        goal_id: goal.id,
        category: goal.category,
        item_id: goal.item_id,
        prayer_segment: goal.prayer_segment,
      });
      setActiveSession(session);
      setCurrentCount(goal.progress);

      // Загружаем данные элемента, если есть item_id
      if (goal.item_id) {
        try {
          const { getDhikrItemById } = await import("@/lib/dhikr-data");
          const itemType = mapCategoryToDhikrType(goal.category);
          if (itemType) {
            const itemData = await getDhikrItemById(goal.item_id, itemType);
          if (itemData) {
            setSelectedItem(itemData);
            }
          }
        } catch (error) {
          console.error("Error loading item data:", error);
        }
      }

      upsertPendingTasbih({
        id: goal.id,
        sessionId: session.id,
        title: goal.item_data?.translation || goal.item_data?.arabic || goal.item_id || goal.id,
        current: goal.progress,
        target: goal.target_count,
        category: goal.category,
        fromGoal: true,
      });
    } catch (error) {
      console.error("Error starting session:", error);
    }
  };

  const handleTap = useCallback(
    async (
      delta: number = 1,
      options?: { skipThrottle?: boolean; source?: "manual" | "bulk" | "auto" }
    ) => {
      const now = Date.now();
      if (!options?.skipThrottle) {
        if (now - lastTapTime < 500) {
          return;
        }
        setLastTapTime(now);
      }

      if (!activeSession) {
        toast({
          title: "Ошибка",
          description: "Сессия не начата",
          variant: "destructive",
        });
        return;
      }

      const newCount = currentCount + delta;
      setCurrentCount(newCount);

      hapticFeedback(options?.source === "auto" ? "selection" : "light");

      try {
        const offline_id = await addOfflineEvent("tap", {
          session_id: activeSession.id,
          delta,
          event_type: "tap",
          prayer_segment: activeSession.prayer_segment,
        });

        const response = await smartTasbihAPI.counterTap({
          session_id: activeSession.id,
          delta,
          event_type: "tap",
          offline_id,
          prayer_segment: activeSession.prayer_segment,
        });

        if (response.goal_progress) {
          if (activeGoal) {
            setActiveGoal({
              ...activeGoal,
              progress: response.goal_progress.progress,
              status: response.goal_progress.is_completed ? "completed" : "active",
            });
            upsertPendingTasbih({
              id: activeGoal.id,
              sessionId: activeSession.id,
              title:
                selectedItem?.translation ||
                selectedItem?.title ||
                activeGoal.item_id ||
                "Тасбих",
              current: response.goal_progress.progress,
              target: activeGoal.target_count,
              category: activeGoal.category,
              fromGoal: true,
            });
          }

          if (response.goal_progress.is_completed) {
            removePendingTasbih(activeGoal?.id || "");
            showTelegramNotification("success");
            toast({
              title: "Цель достигнута!",
              description: "Ма ша Аллах!",
            });
          }
        }

        if (response.daily_azkar) {
          setDailyAzkar(response.daily_azkar);
        }

        const counterType = getCounterType(selectedCategory, selectedItem);
        if (counterType && delta > 0) {
          try {
            await spiritualPathAPI.syncCounter(counterType, delta);
            await loadSpiritualPathGoals();
          } catch (error) {
            console.error("Error syncing with spiritual path goals:", error);
          }
        }

        setLastEvent({ delta, value_after: response.value_after });
        setCanUndo(true);

        if (undoTimeout) {
          clearTimeout(undoTimeout);
        }
        const timeout = setTimeout(() => {
          setCanUndo(false);
          setLastEvent(null);
        }, 5000);
        setUndoTimeout(timeout);

        setRecentEvents((prev) => {
          const event = {
            id: randomId(),
            delta,
            timestamp: Date.now(),
            source: options?.source || (delta > 1 ? "bulk" : "manual"),
          };
          return [event, ...prev].slice(0, 6);
        });
      } catch (error) {
        console.error("Error tapping:", error);
      }
    },
    [
      activeSession,
      currentCount,
      lastTapTime,
      activeGoal,
      undoTimeout,
      selectedCategory,
      selectedItem,
      toast,
      loadSpiritualPathGoals,
    ]
  );

  const handleUndo = useCallback(async () => {
    if (!lastEvent || !activeSession) return;

    try {
      // Отменяем последнее действие
      const offline_id = await addOfflineEvent("tap", {
        session_id: activeSession.id,
        delta: -lastEvent.delta,
        event_type: "tap",
        prayer_segment: activeSession.prayer_segment,
      });

      await smartTasbihAPI.counterTap({
        session_id: activeSession.id,
        delta: -lastEvent.delta,
        event_type: "tap",
        offline_id,
        prayer_segment: activeSession.prayer_segment,
      });

      setCurrentCount(currentCount - lastEvent.delta);
      setCanUndo(false);
      setLastEvent(null);
      if (undoTimeout) {
        clearTimeout(undoTimeout);
      }

      hapticFeedback("medium");
      toast({
        title: "Отменено",
        description: "Последнее действие отменено",
      });
    } catch (error) {
      console.error("Error undoing:", error);
    }
  }, [lastEvent, activeSession, currentCount, undoTimeout, toast]);

  const handleBulkTap = useCallback(
    (delta: number) => {
      handleTap(delta, { source: "bulk" });
    },
    [handleTap]
  );

  useEffect(() => {
    if (!autoMode || !activeSession || isComplete) {
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      return;
    }

    const interval = Math.max(250, Math.round(60000 / Math.max(autoTempo, 20)));
    autoTimerRef.current = setInterval(() => {
      handleTap(1, { skipThrottle: true, source: "auto" });
    }, interval);

    return () => {
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [autoMode, autoTempo, handleTap, activeSession, isComplete]);

  useEffect(() => {
    if ((!activeGoal || isComplete) && autoMode) {
      setAutoMode(false);
    }
  }, [activeGoal, isComplete, autoMode]);

  const handleRepeat = useCallback(async () => {
    if (!activeGoal || activeGoal.goal_type !== "learn") return;

    try {
      const offline_id = await addOfflineEvent("tap", {
        session_id: activeSession?.id || "",
        delta: 0,
        event_type: "repeat",
        prayer_segment: activeSession?.prayer_segment || "none",
      });

      await smartTasbihAPI.counterTap({
        session_id: activeSession?.id || "",
        delta: 0,
        event_type: "repeat",
        offline_id,
        prayer_segment: activeSession?.prayer_segment || "none",
      });

      hapticFeedback("medium");
      toast({
        title: "Повтор зафиксирован",
        description: "Продолжайте практику",
      });
    } catch (error) {
      console.error("Error recording repeat:", error);
    }
  }, [activeGoal, activeSession, toast]);

  const handleLearned = useCallback(async () => {
    if (!activeGoal || activeGoal.goal_type !== "learn") return;

    try {
      await smartTasbihAPI.markLearned(activeGoal.id);
      setActiveGoal({
        ...activeGoal,
        status: "completed",
      });
      removePendingTasbih(activeGoal.id);

      hapticFeedback("heavy");
      showTelegramNotification("success");
      toast({
        title: "Выучено!",
        description: "Ма ша Аллах! Цель завершена",
      });
    } catch (error) {
      console.error("Error marking learned:", error);
    }
  }, [activeGoal, toast]);

  const handleReset = useCallback(async () => {
    if (!activeSession) return;

    try {
      const offline_id = await addOfflineEvent("tap", {
        session_id: activeSession.id,
        delta: -currentCount,
        event_type: "auto_reset",
        prayer_segment: activeSession.prayer_segment,
      });

      await smartTasbihAPI.counterTap({
        session_id: activeSession.id,
        delta: -currentCount,
        event_type: "auto_reset",
        offline_id,
        prayer_segment: activeSession.prayer_segment,
      });

      setCurrentCount(0);
      if (activeGoal) {
        upsertPendingTasbih({
          id: activeGoal.id,
          sessionId: activeSession.id,
          title:
            selectedItem?.translation ||
            selectedItem?.title ||
            activeGoal.item_id ||
            "Тасбих",
          current: 0,
          target: activeGoal.target_count,
          category: activeGoal.category,
          fromGoal: true,
        });
      }
      hapticFeedback("medium");
      toast({
        title: "Сброшено",
        description: "Счетчик обнулен",
      });
    } catch (error) {
      console.error("Error resetting:", error);
    }
  }, [activeSession, currentCount, activeGoal, selectedItem, toast]);

  const handlePrayerSegmentTap = async (segment: PrayerSegment) => {
    try {
      // Создаем цель для ежедневных азкаров
      const goal = await smartTasbihAPI.createOrUpdateGoal({
        category: "azkar",
        goal_type: "recite",
        target_count: 99,
        prayer_segment: segment,
      });

      setActiveGoal(goal);
      await startSessionForGoal(goal);
    } catch (error) {
      console.error("Error creating azkar goal:", error);
    }
  };

  const handleStartRitual = (ritualId: string) => {
    setActiveRitualId(ritualId);
    setRitualStepIndex(0);
    const ritual = rituals.find((r) => r.id === ritualId);
    if (ritual?.auto_tempo) {
      setAutoTempo(ritual.auto_tempo);
      setAutoMode(true);
    }
    toast({
      title: "Ритуал начат",
      description: ritual?.intent || "Сфокусируйтесь на намерении",
    });
  };

  const handleAdvanceRitualStep = () => {
    if (!activeRitual) return;
    const nextIndex = ritualStepIndex + 1;
    if (nextIndex >= activeRitual.steps.length) {
      handleSaveFocusMoment("ritual");
      setActiveRitualId(null);
      setRitualStepIndex(0);
      setAutoMode(false);
      toast({
        title: "Ритуал завершен",
        description: "Запись добавлена в журнал",
      });
      return;
    }
    setRitualStepIndex(nextIndex);
  };

  const handleSaveFocusMoment = (source: "manual" | "ritual" = "manual") => {
    const entry = {
      id: randomId(),
      ritual_id: activeRitual?.id,
      ritual_title: activeRitual?.title,
      mood: sessionMood,
      reflections:
        sessionReflection.trim() ||
        (source === "ritual" ? "Ритуал завершен" : undefined),
      total_count: currentCount,
      created_at: new Date().toISOString(),
    };
    addJournalEntry(entry);
    setSessionReflection("");
    toast({
      title: "Записано",
      description: "Сеанс сохранен в журнал",
    });
  };

  const handleCreateCustomRitual = () => {
    if (!customRitualTitle.trim()) {
      toast({
        title: "Название нужно",
        description: "Добавьте имя вашего ритуала",
        variant: "destructive",
      });
      return;
    }

    const ritual: FocusRitual = {
      id: `custom-${Date.now()}`,
      title: customRitualTitle.trim(),
      intent: customRitualIntent.trim() || "Личный wird",
      mood: customRitualMood,
      auto_tempo: 60,
      steps: [
        {
          id: `custom-step-${Date.now()}`,
          type: "dhikr",
          title: customRitualTitle.trim(),
          instructions: `Повторите ${customRitualCount || "33"} раз и удерживайте фокус`,
          target_count: Number(customRitualCount) || 33,
        },
      ],
      is_custom: true,
    };

    saveCustom(ritual);
    setCustomRitualTitle("");
    setCustomRitualIntent("");
    setCustomRitualCount("33");
    toast({
      title: "Ритуал сохранен",
      description: "Теперь он доступен в списке фокусов",
    });
  };

  const isCountdownMode = activeGoal?.prayer_segment !== "none" && activeGoal?.category === "azkar";
  const displayCount = isCountdownMode 
    ? Math.max(0, activeGoal.target_count - currentCount)
    : currentCount;

  const isComplete = activeGoal && (
    (isCountdownMode && displayCount === 0) ||
    (!isCountdownMode && currentCount >= activeGoal.target_count)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-card border-primary/40 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Ритуалы фокусировки</span>
            <span className="text-sm text-muted-foreground">
              Создавай собственные wird’ы + дыхание
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {rituals.slice(0, 3).map((ritual) => {
              const isActive = activeRitualId === ritual.id;
              return (
                <div
                  key={ritual.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    isActive ? "border-primary shadow-lg" : "border-border/60"
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold">{ritual.title}</p>
                      <p className="text-xs text-muted-foreground">{ritual.intent}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Настрой: {getMoodLabel(ritual.mood)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isActive ? "secondary" : "default"}
                      onClick={() => handleStartRitual(ritual.id)}
                    >
                      {isActive ? "В прогрессе" : "Начать"}
                    </Button>
                  </div>
                  {isActive && (
                    <div className="mt-3 space-y-2">
                      {ritual.steps.map((step, idx) => (
                        <div
                          key={step.id}
                          className={cn(
                            "rounded-lg border px-3 py-2 text-sm",
                            idx === ritualStepIndex
                              ? "border-primary bg-primary/5"
                              : "border-border/40"
                          )}
                        >
                          <p className="font-medium">{step.title}</p>
                          <p className="text-xs text-muted-foreground">{step.instructions}</p>
                        </div>
                      ))}
                      <Button size="sm" className="w-full" onClick={handleAdvanceRitualStep}>
                        Следующий шаг
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-semibold">Собери свой стане</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Название"
                value={customRitualTitle}
                onChange={(e) => setCustomRitualTitle(e.target.value)}
              />
              <Input
                placeholder="Интент / для чего"
                value={customRitualIntent}
                onChange={(e) => setCustomRitualIntent(e.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                type="number"
                min={1}
                placeholder="Повторы"
                value={customRitualCount}
                onChange={(e) => setCustomRitualCount(e.target.value)}
              />
              <Select
                value={customRitualMood}
                onValueChange={(value) => setCustomRitualMood(value as FocusMood)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Настрой" />
                </SelectTrigger>
                <SelectContent>
                  {MOOD_OPTIONS.map((mood) => (
                    <SelectItem key={mood.value} value={mood.value}>
                      {mood.emoji} {mood.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleCreateCustomRitual}>
                Сохранить ритуал
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Ежедневные азкары (5x99) */}
      {dailyAzkar && (
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Ежедневные азкары (5x99)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {PRAYER_SEGMENTS.map((segment) => {
                const count = getDailyCountForSegment(dailyAzkar, segment.value);
                const isComplete = count >= 99;
                return (
                  <div key={segment.value} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{segment.icon}</span>
                        <span className="font-semibold">{segment.label}</span>
                      </div>
                      <Badge variant={isComplete ? "default" : "outline"}>
                        {count}/99
                      </Badge>
                    </div>
                    <Progress 
                      value={(count / 99) * 100} 
                      className={cn("h-2", isComplete && "bg-primary")}
                    />
                    {!isComplete && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrayerSegmentTap(segment.value)}
                        className="w-full"
                      >
                        Начать азкары {segment.label}
                      </Button>
                    )}
                  </div>
                );
              })}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Всего</span>
                  <Badge variant={dailyAzkar.is_complete ? "default" : "outline"}>
                    {dailyAzkar.total}/495
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Выбор категории и элемента */}
      {!activeGoal && (
        <div className="space-y-4">
          <Card className="border-primary/20 bg-background/90">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Выбрать из целей</span>
                <Badge variant="outline">{tasbihLinkedGoals.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasbihLinkedGoals.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Нет активных целей по зикру. Создайте их в разделе «Мой путь».
                </p>
              )}
              {tasbihLinkedGoals.slice(0, 5).map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-lg border border-border/60 p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-sm">{goal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {goal.current_value}/{goal.target_value} • дедлайн{" "}
                      {goal.end_date ? new Date(goal.end_date).toLocaleDateString("ru-RU") : "∞"}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleStartFromSpiritualGoal(goal)}>
                    Продолжить
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <Accordion
              type="single"
              collapsible
              value={manualPickerOpen}
              onValueChange={(value) => setManualPickerOpen(value || null)}
            >
              <AccordionItem value="manual">
                <AccordionTrigger className="px-4 font-semibold">
                  Расширенный выбор (категории/избранные)
                </AccordionTrigger>
                <AccordionContent>
                  <CardContent className="space-y-4 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "dua", label: "Дуа" },
                        { value: "azkar", label: "Азкары" },
                        { value: "salawat", label: "Салаваты" },
                        { value: "kalimat", label: "Калимы" },
                        { value: "names99", label: "99 имён" },
                      ].map((categoryOption) => (
                        <Button
                          key={categoryOption.value}
                          variant={selectedCategory === categoryOption.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(categoryOption.value as Category)}
                        >
                          {categoryOption.label}
                        </Button>
                      ))}
                      <Button
                        variant={showFavoritesOnly ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setShowFavoritesOnly((prev) => !prev)}
                      >
                        {showFavoritesOnly ? "Все карточки" : "Только избранные"}
                      </Button>
                    </div>

                    {loadingItems ? (
                      <div className="text-center py-4 text-muted-foreground">Загрузка...</div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {availableItems
                          .filter((item) => {
                            if (!showFavoritesOnly) return true;
                            const key = `${selectedCategory}:${item.id}`;
                            return favoriteItemIds.includes(key);
                          })
                          .map((item) => {
                            const key = `${selectedCategory}:${item.id}`;
                            const isFavorite = favoriteItemIds.includes(key);
                            return (
                              <Card
                                key={item.id}
                                className={cn(
                                  "cursor-pointer hover:bg-secondary/50 transition-colors",
                                  selectedItem?.id === item.id && "border-primary"
                                )}
                                onClick={() => setSelectedItem(item)}
                              >
                                <CardContent className="p-3 flex items-center justify-between gap-2">
                                  <div>
                                    <p className="font-semibold text-sm">{item.translation || item.title}</p>
                                    {item.reference && (
                                      <p className="text-xs text-muted-foreground">{item.reference}</p>
                                    )}
                                  </div>
                                  <Button
                                    size="icon"
                                    variant={isFavorite ? "secondary" : "ghost"}
                                    className="shrink-0"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      const updated = toggleFavoriteTasbihItem(key);
                                      setFavoriteItemIds(updated);
                                    }}
                                  >
                                    {isFavorite ? "★" : "☆"}
                                  </Button>
                                </CardContent>
                              </Card>
                            );
                          })}
                      </div>
                    )}

                    {selectedItem && (
                      <div className="space-y-3">
                        {linkedGoals.length > 0 && (
                          <div className="bg-primary/5 rounded-lg p-3">
                            <p className="text-xs font-semibold mb-1">
                              💡 Прогресс синхронизируется с целями:
                            </p>
                            {linkedGoals.map((goal) => (
                              <p key={goal.id} className="text-xs text-muted-foreground">
                                • {goal.title}
                              </p>
                            ))}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Обратный отсчёт</Label>
                          <div className="flex flex-wrap gap-2">
                            {[33, 50, 100, 300].map((value) => (
                              <Button
                                key={value}
                                size="sm"
                                variant={manualTarget === value ? "default" : "outline"}
                                onClick={() => setManualTarget(value)}
                              >
                                {value}
                              </Button>
                            ))}
                            <Input
                              type="number"
                              min={1}
                              className="w-24 bg-background"
                              value={manualTarget}
                              onChange={(e) => setManualTarget(parseInt(e.target.value) || 1)}
                            />
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                            className="w-full"
                            onClick={async () => {
                              const goal = await smartTasbihAPI.createOrUpdateGoal({
                                category: selectedCategory,
                                item_id: selectedItem.id,
                                goal_type: "recite",
                                target_count: manualTarget || selectedItem.count || 33,
                              });
                              setActiveGoal(goal);
                              setSelectedItem(selectedItem);
                              setManualPickerOpen(null);
                              await startSessionForGoal(goal);
                            }}
                          >
                            Начать (произнес)
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={async () => {
                              const goal = await smartTasbihAPI.createOrUpdateGoal({
                                category: selectedCategory,
                                item_id: selectedItem.id,
                                goal_type: "learn",
                                target_count: 1,
                              });
                              setActiveGoal(goal);
                              setSelectedItem(selectedItem);
                              setManualPickerOpen(null);
                              await startSessionForGoal(goal);
                            }}
                          >
                            Начать (выучить)
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </div>
      )}

      {/* Главный экран (активная сессия) */}
      {activeGoal && activeSession && (
        <Card className="bg-gradient-card border-primary/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">
                {activeGoal.category === "azkar" && activeGoal.prayer_segment !== "none"
                  ? `Азкары ${PRAYER_SEGMENTS.find(s => s.value === activeGoal.prayer_segment)?.label}`
                  : selectedItem?.translation || "Тасбих"}
              </CardTitle>
              {!isOnline && (
                <Badge variant="outline" className="text-xs">
                  Офлайн
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Контент */}
            {selectedItem && (
              <div className="space-y-4">
                {selectedItem.arabic && (
                  <div className="text-center py-4">
                    <p
                      className="text-4xl font-arabic text-foreground"
                      style={{ fontFamily: "'Amiri', serif" }}
                      dir="rtl"
                    >
                      {selectedItem.arabic}
                    </p>
                  </div>
                )}
                {selectedItem.transcription && (
                  <div className="bg-gradient-to-br from-secondary/40 to-secondary/20 rounded-xl p-4">
                    <p className="text-center text-lg italic">{selectedItem.transcription}</p>
                  </div>
                )}
                {selectedItem.translation && (
                  <div className="bg-gradient-to-br from-primary/8 to-primary/3 rounded-xl p-4">
                    <p className="text-center text-base">{selectedItem.translation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Счетчик */}
            <div className="text-center">
              <div
                className={cn(
                  "inline-flex items-center justify-center w-32 h-32 rounded-full border-4 transition-all duration-300 cursor-pointer",
                  isComplete
                    ? "border-primary bg-primary/10 shadow-glow"
                    : "border-border/30 bg-secondary/30 hover:border-primary/50"
                )}
                onClick={() => handleTap()}
              >
                <div className="text-center">
                  <div className={cn(
                    "text-4xl font-bold transition-colors",
                    isComplete ? "gradient-text" : "text-foreground"
                  )}>
                    {displayCount}
                  </div>
                  {!isCountdownMode && (
                    <div className="text-sm text-muted-foreground">
                      / {activeGoal.target_count}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Прогресс */}
            <Progress
              value={
                isCountdownMode
                  ? ((activeGoal.target_count - displayCount) / activeGoal.target_count) * 100
                  : (currentCount / activeGoal.target_count) * 100
              }
              className="h-3"
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Настрой и отражение</p>
                <div className="flex flex-wrap gap-2">
                  {MOOD_OPTIONS.map((mood) => (
                    <Button
                      key={mood.value}
                      variant={sessionMood === mood.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSessionMood(mood.value)}
                    >
                      {mood.emoji} {mood.label}
                    </Button>
                  ))}
                </div>
                <Textarea
                  placeholder="Короткая заметка (необязательно)"
                  value={sessionReflection}
                  onChange={(e) => setSessionReflection(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <Button variant="secondary" size="sm" onClick={() => handleSaveFocusMoment()}>
                  Сохранить ощущение
                </Button>
              </div>
              <div className="space-y-3 rounded-xl border border-dashed border-primary/30 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Авто-дзикр</p>
                    <p className="text-xs text-muted-foreground">
                      Равномерный темп без отвлечений
                    </p>
                  </div>
                  <Switch
                    checked={autoMode}
                    onCheckedChange={(value) => setAutoMode(value)}
                    disabled={!activeSession || isComplete}
                  />
                </div>
                <div className="space-y-2">
                  <Slider
                    value={[autoTempo]}
                    min={30}
                    max={180}
                    step={5}
                    onValueChange={(value) => setAutoTempo(value[0])}
                    disabled={!activeSession}
                  />
                  <p className="text-xs text-muted-foreground">
                    {autoTempo} ударов в минуту • 1 повтор ≈{" "}
                    {Math.round(60000 / Math.max(autoTempo, 1))} мс
                  </p>
                </div>
              </div>
            </div>

            {/* Информация о связанных целях из spiritual-path */}
            {linkedGoals.length > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary mb-1">
                      Это засчитается в ваши цели:
                    </p>
                    {linkedGoals.map((goal) => {
                      const progressPercent = goal.target_value > 0
                        ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
                        : 0;
                      return (
                        <div key={goal.id} className="mb-2 last:mb-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-medium truncate flex-1">
                              "{goal.title}"
                            </p>
                            <span className="text-xs text-muted-foreground ml-2">
                              {progressPercent}%
                            </span>
                          </div>
                          <Progress value={progressPercent} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Кнопки действий */}
            <div className="space-y-2">
              {activeGoal.goal_type === "recite" ? (
                <>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => handleTap()}
                      disabled={isComplete}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Произнес
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleReset}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkTap(10)}
                      disabled={isComplete}
                    >
                      +10
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkTap(33)}
                      disabled={isComplete}
                    >
                      +33
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkTap(50)}
                      disabled={isComplete}
                    >
                      +50
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkTap(100)}
                      disabled={isComplete}
                    >
                      +100
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={handleRepeat}
                  >
                    Повторил
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={handleLearned}
                    disabled={activeGoal.status === "completed"}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Выучил
                  </Button>
                </div>
              )}
            </div>

            {/* Undo кнопка */}
            {canUndo && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleUndo}
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Отменить (5 сек)
              </Button>
            )}

            {recentEvents.length > 0 && (
              <div className="rounded-lg border border-border/40 p-3 text-xs space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Хроника сессии
                </p>
                {recentEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between text-[11px]"
                  >
                    <span className="text-muted-foreground">{formatTimeAgo(event.timestamp)}</span>
                    <span className="font-semibold">
                      {event.delta > 0 ? "+" : ""}
                      {event.delta}{" "}
                      <span className="text-muted-foreground">
                        ({event.source === "auto" ? "авто" : event.source === "bulk" ? "серия" : "ручн."})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}

            {isComplete && (
              <div className="text-center">
                <p className="text-sm gradient-text-gold font-semibold animate-pulse">
                  ✨ Завершено! Ма ша Аллах
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {journal.length > 0 && (
        <Card className="bg-background/80 border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Журнал сосредоточенности</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {journal.slice(0, 3).map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border/40 p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm">
                    {entry.ritual_title || "Свободная практика"}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {getMoodLabel(entry.mood)}
                  </Badge>
                </div>
                {entry.reflections && (
                  <p className="text-xs text-muted-foreground">{entry.reflections}</p>
                )}
                <p className="text-[11px] text-muted-foreground">{formatJournalDate(entry.created_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

