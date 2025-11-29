import { spiritualPathAPI } from "./api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
const SUBSCRIPTION_STORAGE_KEY = "smart_notifications_push_subscription";

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const isPushSupported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration> => {
  if (!isPushSupported()) {
    throw new Error("Браузер не поддерживает фоновые уведомления");
  }
  return navigator.serviceWorker.ready;
};

export interface PushCapability {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  vapidReady: boolean;
  subscribed: boolean;
  endpoint?: string;
}

export const getPushCapability = async (): Promise<PushCapability> => {
  const supported = isPushSupported();
  if (!supported) {
    return { supported: false, permission: "unsupported", vapidReady: Boolean(VAPID_PUBLIC_KEY), subscribed: false };
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  return {
    supported,
    permission: Notification.permission,
    vapidReady: Boolean(VAPID_PUBLIC_KEY),
    subscribed: Boolean(subscription),
    endpoint: subscription?.endpoint,
  };
};

const persistSubscription = (subscription: PushSubscriptionJSON | null) => {
  if (!subscription) {
    localStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(subscription));
};

export const enableBackgroundNotifications = async () => {
  if (!isPushSupported()) {
    throw new Error("Фоновые уведомления не поддерживаются на этом устройстве");
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error("VAPID ключ не настроен. Укажите VITE_VAPID_PUBLIC_KEY в .env");
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    throw new Error("Разрешите уведомления в браузере, чтобы включить фоновые напоминания");
  }

  const registration = await getServiceWorkerRegistration();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const payload = {
    subscription: subscription.toJSON(),
    platform: navigator.userAgent,
    subscribed_at: new Date().toISOString(),
  };

  await spiritualPathAPI.registerPushSubscription(payload);
  persistSubscription(subscription.toJSON());
  return subscription;
};

export const disableBackgroundNotifications = async () => {
  if (!isPushSupported()) {
    return;
  }

  const registration = await getServiceWorkerRegistration();
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    try {
      await spiritualPathAPI.unregisterPushSubscription(subscription.endpoint);
    } catch (error) {
      console.warn("Failed to unregister push subscription remotely", error);
    }
    await subscription.unsubscribe();
  }

  persistSubscription(null);
};

export const sendLocalNotification = async (title: string, body: string) => {
  if (!isPushSupported()) {
    return;
  }
  const registration = await getServiceWorkerRegistration();

  if (registration.active) {
    registration.active.postMessage({
      type: "LOCAL_NOTIFICATION",
      payload: {
        title,
        body,
      },
    });
  } else {
    new Notification(title, {
      body,
      icon: "/logo.svg",
    });
  }
};

