// Утилиты для улучшения UX

/**
 * Проверяет, является ли устройство мобильным
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;
};

/**
 * Проверяет, поддерживает ли устройство touch
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

/**
 * Получает оптимальный размер шрифта для устройства
 */
export const getOptimalFontSize = (baseSize: number = 16): number => {
  if (typeof window === "undefined") return baseSize;
  const isMobile = isMobileDevice();
  return isMobile ? Math.max(baseSize, 16) : baseSize;
};

/**
 * Получает оптимальный размер touch target (минимум 44x44px для iOS)
 */
export const getOptimalTouchSize = (): number => {
  return isTouchDevice() ? 48 : 40;
};

/**
 * Прокручивает элемент в видимую область с плавной анимацией
 */
export const scrollIntoViewSmooth = (
  element: HTMLElement | null,
  options: ScrollIntoViewOptions = {}
): void => {
  if (!element) return;
  
  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
    ...options,
  });
};

/**
 * Предотвращает двойной клик/тап
 */
export const preventDoubleClick = (
  callback: () => void,
  delay: number = 300
): (() => void) => {
  let lastClick = 0;
  return () => {
    const now = Date.now();
    if (now - lastClick < delay) return;
    lastClick = now;
    callback();
  };
};

/**
 * Оптимизированная задержка для анимаций на мобильных
 */
export const getAnimationDelay = (baseDelay: number): number => {
  // На мобильных устройствах уменьшаем задержки для быстрого отклика
  return isMobileDevice() ? baseDelay * 0.7 : baseDelay;
};

/**
 * Получает безопасные отступы для iOS (notch, home indicator)
 */
export const getSafeAreaInsets = () => {
  if (typeof window === "undefined") {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue("--safe-area-inset-top") || "0", 10),
    bottom: parseInt(style.getPropertyValue("--safe-area-inset-bottom") || "0", 10),
    left: parseInt(style.getPropertyValue("--safe-area-inset-left") || "0", 10),
    right: parseInt(style.getPropertyValue("--safe-area-inset-right") || "0", 10),
  };
};

/**
 * Форматирует число с улучшенной читаемостью
 */
export const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
    ...options,
  }).format(num);
};

/**
 * Форматирует время с улучшенной читаемостью
 */
export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

/**
 * Форматирует дату с улучшенной читаемостью
 */
export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(date);
};

/**
 * Получает относительное время (например, "2 часа назад")
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "только что";
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "минуту" : minutes < 5 ? "минуты" : "минут"} назад`;
  if (hours < 24) return `${hours} ${hours === 1 ? "час" : hours < 5 ? "часа" : "часов"} назад`;
  if (days < 7) return `${days} ${days === 1 ? "день" : days < 5 ? "дня" : "дней"} назад`;
  
  return formatDate(date);
};

/**
 * Копирует текст в буфер обмена с уведомлением
 */
export const copyToClipboard = async (
  text: string,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      onSuccess?.();
    } else {
      // Fallback для старых браузеров
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      onSuccess?.();
    }
  } catch (error) {
    onError?.(error as Error);
  }
};

/**
 * Дебаунс функция для оптимизации производительности
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Троттлинг функция для ограничения частоты вызовов
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

