import { FocusMood, FocusRitual, FocusRitualStep, FocusSessionEntry } from "@/types/smart-tasbih";

const CUSTOM_RITUALS_STORAGE = "focusRituals/custom";
const JOURNAL_STORAGE = "focusRituals/journal";

const defaultSteps = (steps: Array<Partial<FocusRitualStep> & Pick<FocusRitualStep, "id" | "title" | "type" | "instructions">>): FocusRitualStep[] =>
  steps.map((step) => ({
    target_count: 33,
    ...step,
  }));

export const getDefaultFocusRituals = (): FocusRitual[] => [
  {
    id: "calm-breath-33",
    title: "Тихая глубина",
    intent: "Снять тревогу перед важным делом",
    mood: "calm",
    color: "bg-blue-500/20",
    auto_tempo: 48,
    steps: defaultSteps([
      {
        id: "calm-1",
        type: "breath",
        title: "Дыхание 4-7-8",
        instructions: "Вдох 4, задержка 7, выдох 8. Повтори 4 цикла.",
        duration_sec: 60,
      },
      {
        id: "calm-2",
        type: "dhikr",
        title: "СубханАллах",
        instructions: "33 повторения с акцентом на освобождение сердца.",
        target_count: 33,
      },
      {
        id: "calm-3",
        type: "reflection",
        title: "Сфокусируй намерение",
        instructions: "Сформулируй в уме молитву о направлении твоих действий.",
      },
    ]),
  },
  {
    id: "gratitude-cycle",
    title: "Круг благодарности",
    intent: "Настроиться на благодарность и энергию",
    mood: "gratitude",
    color: "bg-amber-500/20",
    auto_tempo: 72,
    steps: defaultSteps([
      {
        id: "gratitude-1",
        type: "reflection",
        title: "Подумай о даре",
        instructions: "Назови про себя 3 дара Аллаха за последние сутки.",
      },
      {
        id: "gratitude-2",
        type: "dhikr",
        title: "Альхамдулиллях",
        instructions: "Повтори 33 раз, представляя дар и его пользу.",
        target_count: 33,
      },
      {
        id: "gratitude-3",
        type: "dhikr",
        title: "Аллаху Акбар",
        instructions: "Ускорь темп и произнеси 34 раза для «перезапуска» энергии.",
        target_count: 34,
      },
    ]),
  },
];

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const loadCustomRituals = (): FocusRitual[] => {
  if (typeof window === "undefined") return [];
  return safeParse<FocusRitual[]>(localStorage.getItem(CUSTOM_RITUALS_STORAGE), []).map((ritual) => ({
    ...ritual,
    is_custom: true,
  }));
};

const persistCustomRituals = (rituals: FocusRitual[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_RITUALS_STORAGE, JSON.stringify(rituals));
};

export const upsertCustomRitual = (ritual: FocusRitual) => {
  const current = loadCustomRituals().filter((r) => r.id !== ritual.id);
  const updated = [...current, { ...ritual, is_custom: true }];
  persistCustomRituals(updated);
  return updated;
};

export const deleteCustomRitual = (ritualId: string) => {
  const updated = loadCustomRituals().filter((r) => r.id !== ritualId);
  persistCustomRituals(updated);
  return updated;
};

export const loadFocusJournal = (): FocusSessionEntry[] => {
  if (typeof window === "undefined") return [];
  return safeParse<FocusSessionEntry[]>(localStorage.getItem(JOURNAL_STORAGE), []);
};

export const addFocusJournalEntry = (entry: FocusSessionEntry) => {
  const current = loadFocusJournal();
  const updated = [entry, ...current].slice(0, 25);
  if (typeof window !== "undefined") {
    localStorage.setItem(JOURNAL_STORAGE, JSON.stringify(updated));
  }
  return updated;
};

export const clearFocusJournal = () => {
  if (typeof window === "undefined") return [];
  localStorage.removeItem(JOURNAL_STORAGE);
  return [];
};

export const getMoodLabel = (mood: FocusMood) => {
  switch (mood) {
    case "calm":
      return "Спокойствие";
    case "gratitude":
      return "Благодарность";
    case "energy":
      return "Энергия";
    case "healing":
      return "Исцеление";
    case "repentance":
      return "Истигфар";
    default:
      return mood;
  }
};

