// Утилиты для работы с подписками и тарифами

import { spiritualPathAPI } from "./api";

export type SubscriptionTier = "muslim" | "mutahsin" | "sahib_al_waqf";

export interface Subscription {
  user_id: string;
  tier: SubscriptionTier;
  subscription_start: string;
  subscription_end: string | null;
  is_active: boolean;
}

// Кэш для тарифа пользователя
let subscriptionCache: Subscription | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

/**
 * Получить тариф пользователя
 */
export async function getUserSubscription(): Promise<Subscription> {
  const now = Date.now();
  
  // Проверяем кэш
  if (subscriptionCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return subscriptionCache;
  }

  try {
    const subscription = await spiritualPathAPI.getSubscription();
    subscriptionCache = subscription;
    cacheTimestamp = now;
    return subscription;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    // Возвращаем бесплатный тариф при ошибке
    return {
      user_id: "unknown",
      tier: "muslim",
      subscription_start: new Date().toISOString(),
      subscription_end: null,
      is_active: true,
    };
  }
}

/**
 * Получить только тариф (tier) пользователя
 */
export async function getUserTier(): Promise<SubscriptionTier> {
  const subscription = await getUserSubscription();
  return subscription.tier;
}

/**
 * Проверить, имеет ли пользователь доступ к функции
 */
export async function hasFeatureAccess(feature: string): Promise<boolean> {
  const tier = await getUserTier();
  
  // Определяем, какая функция доступна для какого тарифа
  const featureAccess: Record<string, SubscriptionTier[]> = {
    // Бесплатные функции доступны всем
    "basic_goals": ["muslim", "mutahsin", "sahib_al_waqf"],
    "basic_calculator": ["muslim", "mutahsin", "sahib_al_waqf"],
    "weekly_digest": ["muslim", "mutahsin", "sahib_al_waqf"],
    "basic_streaks": ["muslim", "mutahsin", "sahib_al_waqf"],
    "basic_badges": ["muslim", "mutahsin", "sahib_al_waqf"],
    
    // PRO функции
    "intelligent_calculator": ["mutahsin", "sahib_al_waqf"],
    "extended_templates": ["mutahsin", "sahib_al_waqf"],
    "ai_recommendations": ["mutahsin", "sahib_al_waqf"],
    "extended_gamification": ["mutahsin", "sahib_al_waqf"],
    
    // Premium функции
    "group_goals": ["sahib_al_waqf"],
    "deep_ai_insights": ["sahib_al_waqf"],
    "priority_notifications": ["sahib_al_waqf"],
    "exclusive_badges": ["sahib_al_waqf"],
  };

  const allowedTiers = featureAccess[feature] || [];
  return allowedTiers.includes(tier);
}

/**
 * Проверить, является ли пользователь Premium
 */
export async function isPremium(): Promise<boolean> {
  const tier = await getUserTier();
  return tier === "sahib_al_waqf";
}

/**
 * Проверить, является ли пользователь PRO
 */
export async function isPro(): Promise<boolean> {
  const tier = await getUserTier();
  return tier === "mutahsin" || tier === "sahib_al_waqf";
}

/**
 * Очистить кэш подписки (например, после обновления тарифа)
 */
export function clearSubscriptionCache(): void {
  subscriptionCache = null;
  cacheTimestamp = 0;
}

