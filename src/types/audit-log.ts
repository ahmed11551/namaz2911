// Типы для AuditLog согласно ТЗ

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: "calculate" | "update_progress" | "add_prayer" | "delete_data" | "update_settings";
  timestamp: Date;
  details: {
    before?: unknown;
    after?: unknown;
    metadata?: Record<string, unknown>;
  };
  ip_address?: string;
  user_agent?: string;
}

export interface AuditLog {
  entries: AuditLogEntry[];
  total: number;
}

