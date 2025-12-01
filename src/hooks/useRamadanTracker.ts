import { useCallback, useEffect, useMemo, useState } from "react";

type RamadanStore = Record<number, number[]>;

const STORE_KEY = "ramadanDaysStore";
const YEAR_KEY = "ramadanSelectedYear";
const CURRENT_YEAR = new Date().getFullYear();

const loadStore = (): RamadanStore => {
  if (typeof window === "undefined") {
    return { [CURRENT_YEAR]: [] };
  }

  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const initial = { [CURRENT_YEAR]: [] };
      localStorage.setItem(STORE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as RamadanStore;
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Invalid ramadan store");
    }
    return parsed;
  } catch (error) {
    console.warn("Failed to load ramadan store:", error);
    const fallback = { [CURRENT_YEAR]: [] };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORE_KEY, JSON.stringify(fallback));
    }
    return fallback;
  }
};

const persistStore = (store: RamadanStore) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
};

const loadYear = () => {
  if (typeof window === "undefined") return CURRENT_YEAR;
  const raw = localStorage.getItem(YEAR_KEY);
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : CURRENT_YEAR;
};

const persistYear = (year: number) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(YEAR_KEY, String(year));
};

const normalizeDays = (days: number[], targetDays: number) =>
  Array.from(new Set(days))
    .filter((day) => day >= 1 && day <= targetDays)
    .sort((a, b) => a - b);

export const useRamadanTracker = (targetDays: number = 30) => {
  const [selectedYear, setSelectedYear] = useState<number>(() => loadYear());
  const [store, setStore] = useState<RamadanStore>(() => loadStore());

  useEffect(() => {
    setStore((prev) => {
      if (prev[selectedYear]) return prev;
      const next = { ...prev, [selectedYear]: [] };
      persistStore(next);
      return next;
    });
  }, [selectedYear]);

  const completedDays = useMemo(() => {
    const days = store[selectedYear] ?? [];
    return normalizeDays(days, targetDays);
  }, [store, selectedYear, targetDays]);

  // Ensure target change trims excess days
  useEffect(() => {
    setStore((prev) => {
      const current = prev[selectedYear] ?? [];
      const normalized = normalizeDays(current, targetDays);
      if (normalized.length === current.length) {
        return prev;
      }
      const next = { ...prev, [selectedYear]: normalized };
      persistStore(next);
      return next;
    });
  }, [selectedYear, targetDays]);

  const updateStore = useCallback(
    (updater: (prev: RamadanStore) => RamadanStore) => {
      setStore((prev) => {
        const next = updater(prev);
        persistStore(next);
        return next;
      });
    },
    []
  );

  const toggleDay = useCallback(
    (day: number) => {
      if (day < 1 || day > targetDays) return;
      updateStore((prev) => {
        const current = prev[selectedYear] ?? [];
        const exists = current.includes(day);
        const nextDays = exists
          ? current.filter((item) => item !== day)
          : normalizeDays([...current, day], targetDays);
        return { ...prev, [selectedYear]: nextDays };
      });
    },
    [selectedYear, targetDays, updateStore]
  );

  const resetYear = useCallback(() => {
    updateStore((prev) => ({ ...prev, [selectedYear]: [] }));
  }, [selectedYear, updateStore]);

  const setYear = useCallback((year: number) => {
    setSelectedYear(year);
    persistYear(year);
  }, []);

  return {
    year: selectedYear,
    completedDays,
    toggleDay,
    resetYear,
    setYear,
  };
};



