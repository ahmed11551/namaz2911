export type FastingPlanType = "ramadan" | "qaza" | "nafl" | "voluntary";

export interface FastingPlan {
  id: string;
  type: FastingPlanType;
  title: string;
  targetDays: number;
  completedDays: number;
  streak: number;
  streakBest: number;
  lastCompletedDate?: string;
  upcomingDates: string[];
  focusText?: string;
}

export interface FastingSummary {
  totalTarget: number;
  totalCompleted: number;
  overallPercent: number;
  nextFastDate?: string;
  overduePlans: number;
}

const STORAGE_KEY = "fastingTrackerPlans";

const todayISO = () => new Date().toISOString().split("T")[0];

const randomId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `fasting-${Math.random().toString(36).slice(2, 10)}`;

const createDefaultPlans = (): FastingPlan[] => [
  {
    id: "ramadan-plan",
    type: "ramadan",
    title: "Рамадан: восполнение",
    targetDays: 30,
    completedDays: 0,
    streak: 0,
    streakBest: 0,
    lastCompletedDate: undefined,
    upcomingDates: [],
    focusText: "Закрой долг Рамадана",
  },
  {
    id: "qaza-fast-plan",
    type: "qaza",
    title: "Каза посты",
    targetDays: 60,
    completedDays: 0,
    streak: 0,
    streakBest: 0,
    lastCompletedDate: undefined,
    upcomingDates: [],
    focusText: "Держи посты из прошлого",
  },
  {
    id: "nafl-fast-plan",
    type: "nafl",
    title: "Суннат и нафл",
    targetDays: 12,
    completedDays: 0,
    streak: 0,
    streakBest: 0,
    lastCompletedDate: undefined,
    upcomingDates: [],
    focusText: "Белые дни, Арафат, Ашура",
  },
  {
    id: "pon-thu-fast-plan",
    type: "voluntary",
    title: "Пост по понедельникам и четвергам",
    targetDays: 104,
    completedDays: 0,
    streak: 0,
    streakBest: 0,
    lastCompletedDate: undefined,
    upcomingDates: [],
    focusText: "Автопланирование Пн/Чт с напоминаниями",
  },
];

const broadcastUpdate = (plans: FastingPlan[]) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("fastingPlansUpdated", {
      detail: plans,
    })
  );
};

const mergeWithDefaults = (plans: FastingPlan[]): FastingPlan[] => {
  const defaults = createDefaultPlans();
  const withBaseline = plans.map((plan) => {
    const baseline = defaults.find((item) => item.id === plan.id);
    if (!baseline) return plan;
    return {
      ...baseline,
      ...plan,
      upcomingDates: Array.isArray(plan.upcomingDates) ? plan.upcomingDates : [],
    };
  });

  const missing = defaults.filter((plan) => !withBaseline.some((item) => item.id === plan.id));
  return [...withBaseline, ...missing];
};

export const loadFastingPlans = (): FastingPlan[] => {
  if (typeof window === "undefined") {
    return createDefaultPlans();
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const defaults = createDefaultPlans();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as FastingPlan[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Invalid fasting plans");
    }
    const normalized = parsed.map((plan) => ({
      ...plan,
      id: plan.id || randomId(),
      upcomingDates: Array.isArray(plan.upcomingDates) ? plan.upcomingDates : [],
    }));
    return mergeWithDefaults(normalized);
  } catch (error) {
    console.warn("Failed to parse fasting plans, resetting:", error);
    const defaults = createDefaultPlans();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
};

export const saveFastingPlans = (plans: FastingPlan[]): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  broadcastUpdate(plans);
};

const isConsecutiveDate = (prevDate?: string, currentDate?: string): boolean => {
  if (!prevDate || !currentDate) return false;
  const prev = new Date(prevDate);
  const current = new Date(currentDate);
  const diff = current.getTime() - prev.getTime();
  return Math.abs(diff) <= 24 * 60 * 60 * 1000; // 1 день
};

export const logFastForPlan = (
  plans: FastingPlan[],
  planId: string,
  date: string = todayISO()
): FastingPlan[] => {
  return plans.map((plan) => {
    if (plan.id !== planId) return plan;

    const completedDays = Math.min(plan.targetDays, plan.completedDays + 1);
    const streak = isConsecutiveDate(plan.lastCompletedDate, date)
      ? plan.streak + 1
      : 1;
    const updatedUpcoming = plan.upcomingDates.filter((d) => d !== date);

    return {
      ...plan,
      completedDays,
      streak,
      streakBest: Math.max(plan.streakBest, streak),
      lastCompletedDate: date,
      upcomingDates: updatedUpcoming,
    };
  });
};

export const scheduleFastForPlan = (
  plans: FastingPlan[],
  planId: string,
  date: string
): FastingPlan[] => {
  if (!date) return plans;
  return plans.map((plan) => {
    if (plan.id !== planId) return plan;
    if (plan.upcomingDates.includes(date)) return plan;
    const updatedDates = [...plan.upcomingDates, date].sort();
    return {
      ...plan,
      upcomingDates: updatedDates.slice(-30), // ограничим список
    };
  });
};

export const updatePlanTarget = (
  plans: FastingPlan[],
  planId: string,
  targetDays: number
): FastingPlan[] => {
  return plans.map((plan) => {
    if (plan.id !== planId) return plan;
    const safeTarget = Math.max(plan.completedDays, Math.min(365, targetDays));
    return {
      ...plan,
      targetDays: safeTarget,
    };
  });
};

export const setPlanCompletedDays = (
  plans: FastingPlan[],
  planId: string,
  completedDays: number
): FastingPlan[] => {
  return plans.map((plan) => {
    if (plan.id !== planId) return plan;
    const safeCompleted = Math.max(0, Math.min(plan.targetDays, completedDays));
    return {
      ...plan,
      completedDays: safeCompleted,
      streak: safeCompleted === 0 ? 0 : plan.streak,
      streakBest: Math.max(plan.streakBest, safeCompleted),
    };
  });
};

export const removeScheduledDate = (
  plans: FastingPlan[],
  planId: string,
  date: string
): FastingPlan[] => {
  return plans.map((plan) => {
    if (plan.id !== planId) return plan;
    return {
      ...plan,
      upcomingDates: plan.upcomingDates.filter((d) => d !== date),
    };
  });
};

export const getFastingSummary = (plans: FastingPlan[]): FastingSummary => {
  const totalTarget = plans.reduce((acc, plan) => acc + plan.targetDays, 0);
  const totalCompleted = plans.reduce((acc, plan) => acc + plan.completedDays, 0);
  const upcomingDates = plans.flatMap((plan) => plan.upcomingDates);
  const nextFastDate = upcomingDates.sort()[0];
  const overduePlans = plans.filter(
    (plan) =>
      plan.upcomingDates.length > 0 &&
      new Date(plan.upcomingDates[0]) < new Date(todayISO())
  ).length;

  return {
    totalTarget,
    totalCompleted,
    overallPercent: totalTarget > 0 ? Math.min(100, (totalCompleted / totalTarget) * 100) : 0,
    nextFastDate,
    overduePlans,
  };
};

