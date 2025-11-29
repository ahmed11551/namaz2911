import { useState, useEffect, useCallback, useRef } from "react";
import { localStorageAPI, prayerDebtAPI } from "@/lib/api";
import type { UserPrayerDebt } from "@/types/prayer-debt";

/**
 * Хук для загрузки данных пользователя из API или localStorage
 * Устраняет дублирование кода в различных компонентах
 * 
 * @returns {Object} Объект с данными пользователя, состоянием загрузки, ошибками и методами обновления
 */
export function useUserData() {
  const [userData, setUserData] = useState<UserPrayerDebt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const loadData = useCallback(async (retry = false) => {
    // Сбрасываем счетчик повторов, если это не повторная попытка
    if (!retry) {
      retryCountRef.current = 0;
    }

    setLoading(true);
    setError(null);
    
    try {
      let savedData: UserPrayerDebt | null = null;

      // Попытка загрузить из API
      try {
        await prayerDebtAPI.getSnapshot();
        // Если API доступен, загружаем из localStorage (который синхронизируется с API)
        savedData = localStorageAPI.getUserData();
      } catch (apiError) {
        // Если API недоступен, загружаем из localStorage
        console.warn("API недоступен, используем localStorage:", apiError);
        savedData = localStorageAPI.getUserData();
      }

      // Проверяем, что компонент еще смонтирован
      if (!isMountedRef.current) {
        return;
      }

      if (savedData) {
        // Валидация структуры данных
        if (
          typeof savedData === "object" &&
          savedData !== null &&
          ("debt_calculation" in savedData || "repayment_progress" in savedData)
        ) {
          setUserData(savedData);
          retryCountRef.current = 0; // Сбрасываем счетчик при успешной загрузке
        } else {
          throw new Error("Неверная структура данных пользователя");
        }
      } else {
        setUserData(null);
      }
    } catch (err) {
      const error = err instanceof Error 
        ? err 
        : new Error("Не удалось загрузить данные пользователя");
      
      // Проверяем, что компонент еще смонтирован
      if (!isMountedRef.current) {
        return;
      }

      // Повторная попытка при ошибках сети
      if (
        retryCountRef.current < maxRetries &&
        (error.message.includes("network") || 
         error.message.includes("fetch") ||
         error.message.includes("timeout"))
      ) {
        retryCountRef.current += 1;
        console.warn(`Повторная попытка загрузки (${retryCountRef.current}/${maxRetries})...`);
        
        // Экспоненциальная задержка: 1s, 2s, 4s
        const delay = Math.pow(2, retryCountRef.current - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return loadData(true);
      }

      setError(error);
      console.error("Failed to load user data:", error);
      
      // Пытаемся загрузить из localStorage как fallback
      try {
        const fallbackData = localStorageAPI.getUserData();
        if (fallbackData && isMountedRef.current) {
          setUserData(fallbackData);
          setError(null); // Очищаем ошибку, если fallback успешен
        }
      } catch (fallbackError) {
        console.error("Fallback загрузка также не удалась:", fallbackError);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const refreshData = useCallback(() => {
    try {
      const savedData = localStorageAPI.getUserData();
      if (savedData && isMountedRef.current) {
        setUserData(savedData);
        setError(null);
      }
    } catch (err) {
      const error = err instanceof Error 
        ? err 
        : new Error("Не удалось обновить данные");
      if (isMountedRef.current) {
        setError(error);
        console.error("Failed to refresh user data:", error);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    // Слушаем события обновления данных
    const handleDataUpdate = () => {
      if (isMountedRef.current) {
        loadData(false);
      }
    };

    window.addEventListener('userDataUpdated', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate); // Слушаем изменения localStorage

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('userDataUpdated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
    };
  }, [loadData]);

  return {
    userData,
    loading,
    error,
    refreshData,
    reloadData: () => loadData(false),
  };
}
