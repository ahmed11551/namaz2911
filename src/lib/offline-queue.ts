// Офлайн-очередь для тасбиха с использованием IndexedDB

// Простая функция генерации UUID
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const DB_NAME = "tasbih_offline_queue";
const DB_VERSION = 1;
const STORE_NAME = "events";

type OfflineEventData =
  | { session_id: string; delta: number; event_type?: string; prayer_segment?: string }
  | { goal_id: string }
  | { session_id: string; goal_id?: string; category?: string; item_id?: string; prayer_segment?: string }
  | Record<string, unknown>;

export interface OfflineEvent {
  id: string;
  offline_id: string;
  type: "tap" | "learn_mark" | "session_start" | "session_end";
  data: OfflineEventData;
  timestamp: Date;
  synced: boolean;
}

let db: IDBDatabase | null = null;

// Инициализация IndexedDB
export async function initOfflineQueue(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("offline_id", "offline_id", { unique: true });
        store.createIndex("synced", "synced", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

// Добавление события в очередь
export async function addOfflineEvent(
  type: OfflineEvent["type"],
  data: OfflineEventData
): Promise<string> {
  if (!db) {
    await initOfflineQueue();
  }

  const offline_id = generateUUID();
  const event: OfflineEvent = {
    id: generateUUID(),
    offline_id,
    type,
    data,
    timestamp: new Date(),
    synced: false,
  };

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(event);

    request.onsuccess = () => resolve(offline_id);
    request.onerror = () => reject(request.error);
  });
}

// Получение всех несинхронизированных событий
export async function getUnsyncedEvents(): Promise<OfflineEvent[]> {
  if (!db) {
    await initOfflineQueue();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("synced");
    const request = index.getAll(false);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Отметка события как синхронизированного
export async function markEventAsSynced(offline_id: string): Promise<void> {
  if (!db) {
    await initOfflineQueue();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("offline_id");
    const request = index.get(offline_id);

    request.onsuccess = () => {
      const event = request.result;
      if (event) {
        event.synced = true;
        const updateRequest = store.put(event);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        resolve(); // Событие уже удалено или не найдено
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Удаление старых синхронизированных событий (старше 30 дней)
export async function cleanupOldEvents(): Promise<void> {
  if (!db) {
    await initOfflineQueue();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("timestamp");
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const request = index.openCursor(IDBKeyRange.upperBound(thirtyDaysAgo));
    const eventsToDelete: string[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const eventData = cursor.value as OfflineEvent;
        if (eventData.synced) {
          eventsToDelete.push(eventData.id);
        }
        cursor.continue();
      } else {
        // Удаляем все найденные события
        eventsToDelete.forEach((id) => {
          store.delete(id);
        });
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Получение последних N событий
export async function getRecentEvents(limit: number = 10): Promise<OfflineEvent[]> {
  if (!db) {
    await initOfflineQueue();
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("timestamp");
    const request = index.openCursor(null, "prev");
    const events: OfflineEvent[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor && events.length < limit) {
        events.push(cursor.value);
        cursor.continue();
      } else {
        resolve(events);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

