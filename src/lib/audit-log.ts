// Утилиты для AuditLog согласно ТЗ

import type { AuditLogEntry } from "@/types/audit-log";

const AUDIT_LOG_STORAGE_KEY = "prayer_debt_audit_log";
const MAX_LOG_ENTRIES = 1000; // Ограничение размера лога

/**
 * Создание записи в AuditLog
 */
export function createAuditLogEntry(
  userId: string,
  action: AuditLogEntry["action"],
  details: AuditLogEntry["details"]
): AuditLogEntry {
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    action,
    timestamp: new Date(),
    details,
    ip_address: undefined, // В реальном приложении получать с бэкенда
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  };
}

/**
 * Сохранение записи в AuditLog
 */
export function saveAuditLogEntry(entry: AuditLogEntry): void {
  try {
    const existing = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    let logs: AuditLogEntry[] = [];
    
    if (existing) {
      try {
        logs = JSON.parse(existing);
        // Валидация, что это массив
        if (!Array.isArray(logs)) {
          logs = [];
        }
      } catch (parseError) {
        console.error("Failed to parse audit log from localStorage:", parseError);
        logs = [];
      }
    }

    // Десериализация дат
    const parsedLogs = logs.map((log) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));

    // Добавление новой записи
    parsedLogs.push(entry);

    // Ограничение размера (удаление старых записей)
    if (parsedLogs.length > MAX_LOG_ENTRIES) {
      parsedLogs.splice(0, parsedLogs.length - MAX_LOG_ENTRIES);
    }

    // Сериализация для сохранения
    const serialized = parsedLogs.map((log) => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
    }));

    localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error("Failed to save audit log entry:", error);
  }
}

/**
 * Получение всех записей AuditLog
 */
export function getAuditLogEntries(userId?: string): AuditLogEntry[] {
  try {
    const existing = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (!existing) return [];

    let logs: AuditLogEntry[] = [];
    try {
      logs = JSON.parse(existing);
      // Валидация, что это массив
      if (!Array.isArray(logs)) {
        return [];
      }
    } catch (parseError) {
      console.error("Failed to parse audit log from localStorage:", parseError);
      return [];
    }

    // Десериализация дат
    const parsedLogs = logs.map((log) => ({
      ...log,
      timestamp: new Date(log.timestamp),
    }));

    // Фильтрация по user_id, если указан
    if (userId) {
      return parsedLogs.filter((log) => log.user_id === userId);
    }

    return parsedLogs;
  } catch (error) {
    console.error("Failed to load audit log entries:", error);
    return [];
  }
}

/**
 * Очистка AuditLog
 */
export function clearAuditLog(): void {
  localStorage.removeItem(AUDIT_LOG_STORAGE_KEY);
}

/**
 * Логирование действия расчета
 */
export function logCalculation(userId: string, before: unknown, after: unknown): void {
  const entry = createAuditLogEntry(userId, "calculate", {
    before,
    after,
    metadata: {
      source: "calculator",
    },
  });
  saveAuditLogEntry(entry);
}

/**
 * Логирование обновления прогресса
 */
export function logProgressUpdate(
  userId: string,
  before: unknown,
  after: unknown,
  changes: Record<string, number>
): void {
  const entry = createAuditLogEntry(userId, "update_progress", {
    before,
    after,
    metadata: {
      changes,
      source: "progress_update",
    },
  });
  saveAuditLogEntry(entry);
}

/**
 * Логирование добавления намаза
 */
export function logPrayerAdded(userId: string, prayerType: string, count: number): void {
  const entry = createAuditLogEntry(userId, "add_prayer", {
    metadata: {
      prayer_type: prayerType,
      count,
      source: "calendar_or_dialog",
    },
  });
  saveAuditLogEntry(entry);
}

