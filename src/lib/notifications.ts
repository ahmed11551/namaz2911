// Система уведомлений о намазах

export interface PrayerNotificationSettings {
  enabled: boolean;
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
  minutesBefore: number; // За сколько минут до намаза уведомлять
  sound: boolean;
  vibrate: boolean;
}

const DEFAULT_SETTINGS: PrayerNotificationSettings = {
  enabled: true,
  fajr: true,
  dhuhr: true,
  asr: true,
  maghrib: true,
  isha: true,
  minutesBefore: 15,
  sound: true,
  vibrate: true,
};

// Получить настройки уведомлений
export const getNotificationSettings = (): PrayerNotificationSettings => {
  const saved = localStorage.getItem("prayer_notifications");
  if (saved) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
};

// Сохранить настройки
export const saveNotificationSettings = (settings: PrayerNotificationSettings): void => {
  localStorage.setItem("prayer_notifications", JSON.stringify(settings));
};

// Проверить поддержку уведомлений
export const isNotificationSupported = (): boolean => {
  return "Notification" in window;
};

// Запросить разрешение на уведомления
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    console.warn("Notifications not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

// Получить статус разрешения
export const getNotificationPermission = (): NotificationPermission | "unsupported" => {
  if (!isNotificationSupported()) {
    return "unsupported";
  }
  return Notification.permission;
};

// Иконки для намазов
const PRAYER_ICONS: Record<string, string> = {
  fajr: "🌙",
  dhuhr: "☀️",
  asr: "🌤️",
  maghrib: "🌅",
  isha: "🌑",
};

// Названия намазов
const PRAYER_NAMES: Record<string, string> = {
  fajr: "Фаджр",
  dhuhr: "Зухр",
  asr: "Аср",
  maghrib: "Магриб",
  isha: "Иша",
};

// Мотивационные сообщения
const MOTIVATION_MESSAGES = [
  "Намаз лучше сна!",
  "Время поминания Аллаха",
  "Не пропустите благословение",
  "Успех в обоих мирах",
  "Намаз - ключ к Раю",
];

// Показать уведомление о намазе
export const showPrayerNotification = (
  prayerKey: string,
  time: string,
  minutesBefore: number
): void => {
  if (Notification.permission !== "granted") {
    return;
  }

  const icon = PRAYER_ICONS[prayerKey] || "🕌";
  const name = PRAYER_NAMES[prayerKey] || prayerKey;
  const motivation = MOTIVATION_MESSAGES[Math.floor(Math.random() * MOTIVATION_MESSAGES.length)];

  const title = minutesBefore > 0 
    ? `${icon} ${name} через ${minutesBefore} минут`
    : `${icon} Время ${name}!`;

  const body = minutesBefore > 0
    ? `Подготовьтесь к намазу. ${motivation}`
    : `${time} - ${motivation}`;

  const notification = new Notification(title, {
    body,
    icon: "/logo192.png", // Иконка приложения
    badge: "/logo192.png",
    tag: `prayer-${prayerKey}`, // Предотвращает дублирование
    renotify: true,
    requireInteraction: minutesBefore === 0, // Не исчезает автоматически в момент намаза
    silent: false,
    vibrate: [200, 100, 200], // Паттерн вибрации
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  // Автоматически закрыть через 30 секунд
  setTimeout(() => notification.close(), 30000);
};

// Тестовое уведомление
export const sendTestNotification = async (): Promise<boolean> => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return false;
  }

  const notification = new Notification("🕌 Тестовое уведомление", {
    body: "Уведомления о намазах настроены успешно! ИншаАллах, вы не пропустите ни одного намаза.",
    icon: "/logo192.png",
    tag: "test-notification",
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };

  return true;
};

// Менеджер таймеров уведомлений
class PrayerNotificationManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private settings: PrayerNotificationSettings = DEFAULT_SETTINGS;

  constructor() {
    this.settings = getNotificationSettings();
  }

  // Обновить настройки
  updateSettings(settings: PrayerNotificationSettings): void {
    this.settings = settings;
    saveNotificationSettings(settings);
  }

  // Запланировать уведомление
  scheduleNotification(prayerKey: string, prayerTime: Date): void {
    // Отменяем предыдущий таймер для этого намаза
    this.cancelNotification(prayerKey);

    if (!this.settings.enabled || !this.settings[prayerKey as keyof PrayerNotificationSettings]) {
      return;
    }

    const now = new Date();
    
    // Уведомление за N минут до намаза
    const reminderTime = new Date(prayerTime.getTime() - this.settings.minutesBefore * 60 * 1000);
    const reminderDelay = reminderTime.getTime() - now.getTime();

    if (reminderDelay > 0) {
      const reminderId = setTimeout(() => {
        showPrayerNotification(
          prayerKey, 
          prayerTime.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
          this.settings.minutesBefore
        );
      }, reminderDelay);
      
      this.timers.set(`${prayerKey}-reminder`, reminderId);
    }

    // Уведомление в момент намаза
    const exactDelay = prayerTime.getTime() - now.getTime();
    
    if (exactDelay > 0) {
      const exactId = setTimeout(() => {
        showPrayerNotification(
          prayerKey,
          prayerTime.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
          0
        );
      }, exactDelay);
      
      this.timers.set(`${prayerKey}-exact`, exactId);
    }
  }

  // Отменить уведомление
  cancelNotification(prayerKey: string): void {
    const reminderTimer = this.timers.get(`${prayerKey}-reminder`);
    const exactTimer = this.timers.get(`${prayerKey}-exact`);
    
    if (reminderTimer) {
      clearTimeout(reminderTimer);
      this.timers.delete(`${prayerKey}-reminder`);
    }
    
    if (exactTimer) {
      clearTimeout(exactTimer);
      this.timers.delete(`${prayerKey}-exact`);
    }
  }

  // Отменить все уведомления
  cancelAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }

  // Запланировать все намазы на сегодня
  scheduleAllPrayers(prayerTimes: Record<string, string>): void {
    this.cancelAll();

    const today = new Date();
    
    Object.entries(prayerTimes).forEach(([key, time]) => {
      if (key === "sunrise") return; // Восход - не намаз
      
      const [hours, minutes] = time.split(":").map(Number);
      const prayerDate = new Date(today);
      prayerDate.setHours(hours, minutes, 0, 0);
      
      // Если время уже прошло, планируем на завтра
      if (prayerDate < today) {
        prayerDate.setDate(prayerDate.getDate() + 1);
      }
      
      this.scheduleNotification(key, prayerDate);
    });
  }
}

// Синглтон менеджера
export const notificationManager = new PrayerNotificationManager();

