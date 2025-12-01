import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Импортируем утилиты для тестирования API (только в dev режиме)
if (import.meta.env.DEV) {
  import("./lib/api-test");
}

createRoot(document.getElementById("root")!).render(<App />);

// Регистрация Service Worker для фоновых уведомлений и offline-функций
if ("serviceWorker" in navigator) {
  const swPath = "/service-worker.js";

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(swPath)
      .then((registration) => {
        if (import.meta.env.DEV) {
          console.info("[ServiceWorker] registered", registration.scope);
        }
      })
      .catch((error) => {
        console.error("[ServiceWorker] registration failed:", error);
      });
  });
}
