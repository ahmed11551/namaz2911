import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FastingPlan,
  FastingSummary,
  getFastingSummary,
  loadFastingPlans,
  logFastForPlan,
  removeScheduledDate,
  saveFastingPlans,
  scheduleFastForPlan,
  setPlanCompletedDays,
  updatePlanTarget,
} from "@/lib/fasting-tracker";

type PlansUpdater = (plans: FastingPlan[]) => FastingPlan[];

const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient;
};

export const useFastingTracker = () => {
  const isClient = useIsClient();
  const [plans, setPlans] = useState<FastingPlan[]>(() => []);

  useEffect(() => {
    if (!isClient) return;
    setPlans(loadFastingPlans());
  }, [isClient]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (event: Event) => {
      const custom = event as CustomEvent<FastingPlan[]>;
      if (Array.isArray(custom.detail)) {
        setPlans(custom.detail);
      }
    };
    window.addEventListener("fastingPlansUpdated", handler);
    return () => window.removeEventListener("fastingPlansUpdated", handler);
  }, []);

  const updatePlans = useCallback(
    (updater: PlansUpdater) => {
      setPlans((prev) => {
        const next = updater(prev);
        saveFastingPlans(next);
        return next;
      });
    },
    [setPlans]
  );

  const logFast = useCallback(
    (planId: string, date?: string) => {
      updatePlans((prev) => logFastForPlan(prev, planId, date));
    },
    [updatePlans]
  );

  const scheduleFast = useCallback(
    (planId: string, date: string) => {
      updatePlans((prev) => scheduleFastForPlan(prev, planId, date));
    },
    [updatePlans]
  );

  const cancelScheduledDate = useCallback(
    (planId: string, date: string) => {
      updatePlans((prev) => removeScheduledDate(prev, planId, date));
    },
    [updatePlans]
  );

  const changeTarget = useCallback(
    (planId: string, target: number) => {
      updatePlans((prev) => updatePlanTarget(prev, planId, target));
    },
    [updatePlans]
  );

  const setCompletion = useCallback(
    (planId: string, completed: number) => {
      updatePlans((prev) => setPlanCompletedDays(prev, planId, completed));
    },
    [updatePlans]
  );

  const summary: FastingSummary = useMemo(() => getFastingSummary(plans), [plans]);

  return {
    plans,
    summary,
    logFast,
    scheduleFast,
    cancelScheduledDate,
    changeTarget,
    setCompletion,
  };
};

