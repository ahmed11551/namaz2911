// Интеграция с Telegram Mini App (WebApp API)

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name?: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
          };
          chat?: {
            id: number;
            type: string;
            title?: string;
            username?: string;
            first_name?: string;
            last_name?: string;
          };
          auth_date: number;
          hash: string;
        };
        version: string;
        platform: string;
        colorScheme: "light" | "dark";
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setParams: (params: {
            text?: string;
            color?: string;
            text_color?: string;
            is_active?: boolean;
            is_visible?: boolean;
          }) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
        CloudStorage: {
          setItem: (key: string, value: string, callback?: (error: Error | null, success: boolean) => void) => void;
          getItem: (key: string, callback: (error: Error | null, value: string | null) => void) => void;
          getItems: (keys: string[], callback: (error: Error | null, values: Record<string, string>) => void) => void;
          removeItem: (key: string, callback?: (error: Error | null, success: boolean) => void) => void;
          removeItems: (keys: string[], callback?: (error: Error | null, success: boolean) => void) => void;
          getKeys: (callback: (error: Error | null, keys: string[]) => void) => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
        openTelegramLink: (url: string) => void;
        openInvoice: (url: string, callback?: (status: string) => void) => void;
        showPopup: (params: {
          title?: string;
          message: string;
          buttons?: Array<{
            id?: string;
            type?: "default" | "ok" | "close" | "cancel" | "destructive";
            text: string;
          }>;
        }, callback?: (id: string) => void) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
        showScanQrPopup: (params: {
          text?: string;
        }, callback?: (data: string) => void) => void;
        closeScanQrPopup: () => void;
        readTextFromClipboard: (callback?: (text: string) => void) => void;
        requestWriteAccess: (callback?: (granted: boolean) => void) => void;
        requestContact: (callback?: (granted: boolean) => void) => void;
        onEvent: (eventType: string, eventHandler: () => void) => void;
        offEvent: (eventType: string, eventHandler: () => void) => void;
      };
    };
  }
}

/**
 * Проверка, запущено ли приложение в Telegram
 */
export function isTelegramWebApp(): boolean {
  return typeof window !== "undefined" && window.Telegram?.WebApp !== undefined;
}

/**
 * Получить экземпляр Telegram WebApp
 */
export function getTelegramWebApp() {
  if (!isTelegramWebApp()) {
    return null;
  }
  return window.Telegram!.WebApp;
}

/**
 * Инициализация Telegram WebApp
 */
export function initTelegramWebApp() {
  if (!isTelegramWebApp()) {
    return;
  }

  const tg = window.Telegram!.WebApp;
  
  // Расширяем приложение на весь экран
  tg.expand();
  
  // Готовность приложения
  tg.ready();
  
  // Устанавливаем цвет фона
  if (tg.themeParams.bg_color) {
    document.documentElement.style.setProperty("--telegram-bg-color", tg.themeParams.bg_color);
  }
  
  // Устанавливаем цвет текста
  if (tg.themeParams.text_color) {
    document.documentElement.style.setProperty("--telegram-text-color", tg.themeParams.text_color);
  }

  return tg;
}

/**
 * Получить данные пользователя из Telegram
 */
export function getTelegramUser() {
  const tg = getTelegramWebApp();
  if (!tg) return null;
  return tg.initDataUnsafe.user;
}

/**
 * Получить ID пользователя Telegram
 */
export function getTelegramUserId(): string | null {
  const user = getTelegramUser();
  return user ? `tg_${user.id}` : null;
}

/**
 * Сохранение данных в Telegram Cloud Storage
 */
export async function saveToTelegramCloud(key: string, value: string): Promise<boolean> {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (!tg) {
      resolve(false);
      return;
    }

    tg.CloudStorage.setItem(key, value, (error) => {
      resolve(!error);
    });
  });
}

/**
 * Загрузка данных из Telegram Cloud Storage
 */
export async function loadFromTelegramCloud(key: string): Promise<string | null> {
  return new Promise((resolve) => {
    const tg = getTelegramWebApp();
    if (!tg) {
      resolve(null);
      return;
    }

    tg.CloudStorage.getItem(key, (error, value) => {
      if (error) {
        resolve(null);
        return;
      }
      resolve(value);
    });
  });
}

/**
 * Тактильная обратная связь
 */
export function hapticFeedback(style: "light" | "medium" | "heavy" | "rigid" | "soft" = "medium") {
  const tg = getTelegramWebApp();
  if (!tg) return;
  tg.HapticFeedback.impactOccurred(style);
}

/**
 * Показать уведомление
 */
export function showTelegramNotification(type: "error" | "success" | "warning" = "success") {
  const tg = getTelegramWebApp();
  if (!tg) return;
  tg.HapticFeedback.notificationOccurred(type);
}

