import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addFocusJournalEntry,
  deleteCustomRitual,
  getDefaultFocusRituals,
  loadCustomRituals,
  loadFocusJournal,
  upsertCustomRitual,
} from "@/lib/focus-rituals";
import type { FocusRitual, FocusSessionEntry } from "@/types/smart-tasbih";

const DEFAULTS = getDefaultFocusRituals();

export const useFocusRituals = () => {
  const [customRituals, setCustomRituals] = useState<FocusRitual[]>([]);
  const [journal, setJournal] = useState<FocusSessionEntry[]>([]);

  useEffect(() => {
    setCustomRituals(loadCustomRituals());
    setJournal(loadFocusJournal());
  }, []);

  const rituals = useMemo(() => [...DEFAULTS, ...customRituals], [customRituals]);

  const saveCustom = useCallback((ritual: FocusRitual) => {
    const updated = upsertCustomRitual(ritual);
    setCustomRituals(updated);
  }, []);

  const removeCustom = useCallback((ritualId: string) => {
    const updated = deleteCustomRitual(ritualId);
    setCustomRituals(updated);
  }, []);

  const addJournalEntry = useCallback((entry: FocusSessionEntry) => {
    const updated = addFocusJournalEntry(entry);
    setJournal(updated);
  }, []);

  return {
    rituals,
    customRituals,
    saveCustom,
    removeCustom,
    journal,
    addJournalEntry,
  };
};

