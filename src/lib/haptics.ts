// Утилиты для haptic feedback (виброотклик) на мобильных устройствах

export const hapticFeedback = {
  // Лёгкая вибрация (для обычных действий)
  light: () => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
    } else if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  // Средняя вибрация (для важных действий)
  medium: () => {
    if (typeof window !== "undefined" && window.Telegram.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("medium");
    } else if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  },

  // Сильная вибрация (для критических действий)
  heavy: () => {
    if (typeof window !== "undefined" && window.Telegram.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred("heavy");
    } else if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  },

  // Вибрация успеха
  success: () => {
    if (typeof window !== "undefined" && window.Telegram.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
    } else if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
  },

  // Вибрация ошибки
  error: () => {
    if (typeof window !== "undefined" && window.Telegram.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("error");
    } else if (navigator.vibrate) {
      navigator.vibrate([20, 50, 20, 50, 20]);
    }
  },

  // Вибрация предупреждения
  warning: () => {
    if (typeof window !== "undefined" && window.Telegram.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred("warning");
    } else if (navigator.vibrate) {
      navigator.vibrate([15, 30, 15]);
    }
  },
};

