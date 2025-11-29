const CACHE_NAME = "prayer-debt-static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

const showNotification = async (payload = {}) => {
  const title = payload.title || "Prayer Debt Tracker";
  const options = {
    body: payload.body || payload.message || "Напоминание от трекера духовного пути",
    icon: payload.icon || "/logo.svg",
    badge: payload.badge || "/logo.svg",
    data: payload.data || {},
    tag: payload.tag || "prayer-debt-notification",
    renotify: payload.renotify ?? false,
    actions: payload.actions || [
      {
        action: "open_app",
        title: "Открыть",
      },
    ],
  };

  await self.registration.showNotification(title, options);
};

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Напоминание", body: event.data.text() };
  }

  event.waitUntil(showNotification(payload));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Позволяет приложению отправлять локальные уведомления через postMessage
self.addEventListener("message", (event) => {
  if (event.data?.type === "LOCAL_NOTIFICATION") {
    showNotification(event.data.payload || {});
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return caches.open(CACHE_NAME).then((cache) =>
        fetch(request).then((response) => {
          cache.put(request, response.clone());
          return response;
        })
      );
    })
  );
});

