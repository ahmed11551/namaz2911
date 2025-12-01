export interface PendingTasbihEntry {
  id: string; // goalId (preferred)
  sessionId?: string;
  title: string;
  current: number;
  target: number;
  category?: string;
  updatedAt: string;
  fromGoal?: boolean;
}

const PENDING_STORAGE_KEY = "pendingTasbihEntries";
const FAVORITES_STORAGE_KEY = "tasbihFavorites";

const dispatchPendingEvent = (entries: PendingTasbihEntry[]) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("pendingTasbihUpdated", {
      detail: entries,
    })
  );
};

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const loadPendingTasbih = (): PendingTasbihEntry[] => {
  if (typeof window === "undefined") return [];
  return safeParse<PendingTasbihEntry[]>(localStorage.getItem(PENDING_STORAGE_KEY), []).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

export const savePendingTasbih = (entries: PendingTasbihEntry[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(entries));
  dispatchPendingEvent(entries);
};

export const upsertPendingTasbih = (entry: PendingTasbihEntry) => {
  const entries = loadPendingTasbih();
  const idx = entries.findIndex((item) => item.id === entry.id);
  if (idx >= 0) {
    entries[idx] = { ...entries[idx], ...entry, updatedAt: new Date().toISOString() };
  } else {
    entries.unshift({
      ...entry,
      updatedAt: new Date().toISOString(),
    });
  }
  savePendingTasbih(entries);
};

export const removePendingTasbih = (id: string) => {
  const entries = loadPendingTasbih().filter((entry) => entry.id !== id);
  savePendingTasbih(entries);
};

export const clearPendingTasbih = () => {
  savePendingTasbih([]);
};

export const loadFavoriteTasbihItems = (): string[] => {
  if (typeof window === "undefined") return [];
  return safeParse<string[]>(localStorage.getItem(FAVORITES_STORAGE_KEY), []);
};

export const saveFavoriteTasbihItems = (ids: string[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
};

export const toggleFavoriteTasbihItem = (itemKey: string): string[] => {
  const current = loadFavoriteTasbihItems();
  const exists = current.includes(itemKey);
  const updated = exists ? current.filter((key) => key !== itemKey) : [...current, itemKey];
  saveFavoriteTasbihItems(updated);
  return updated;
};

export const isFavoriteTasbihItem = (itemKey: string): boolean => {
  return loadFavoriteTasbihItems().includes(itemKey);
};

