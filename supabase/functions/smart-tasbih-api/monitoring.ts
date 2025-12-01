// Модуль мониторинга производительности для Smart Tasbih API
// Отслеживает время ответа, количество запросов, ошибки

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration_ms: number;
  status_code: number;
  timestamp: Date;
  user_id?: string;
  error?: string;
}

interface AggregatedMetrics {
  endpoint: string;
  method: string;
  total_requests: number;
  success_count: number;
  error_count: number;
  avg_duration_ms: number;
  p50_duration_ms: number;
  p95_duration_ms: number;
  p99_duration_ms: number;
  min_duration_ms: number;
  max_duration_ms: number;
  period_start: Date;
  period_end: Date;
}

// Хранилище метрик в памяти (в production лучше использовать внешний сервис)
const metricsStore: PerformanceMetrics[] = [];
const MAX_METRICS = 10000; // Ограничение для предотвращения утечек памяти

/**
 * Записывает метрику производительности
 */
export function recordMetric(
  endpoint: string,
  method: string,
  duration_ms: number,
  status_code: number,
  user_id?: string,
  error?: string
): void {
  const metric: PerformanceMetrics = {
    endpoint,
    method,
    duration_ms,
    status_code,
    timestamp: new Date(),
    user_id,
    error,
  };

  metricsStore.push(metric);

  // Ограничиваем размер хранилища
  if (metricsStore.length > MAX_METRICS) {
    metricsStore.shift();
  }

  // Логируем медленные запросы (>150ms)
  if (duration_ms > 150) {
    console.warn(
      `Slow request detected: ${method} ${endpoint} took ${duration_ms}ms (user: ${user_id || "unknown"})`
    );
  }

  // Логируем ошибки
  if (status_code >= 400 || error) {
    console.error(
      `Error in ${method} ${endpoint}: ${error || `HTTP ${status_code}`} (user: ${user_id || "unknown"})`
    );
  }
}

/**
 * Обертка для измерения времени выполнения функции
 */
export async function measurePerformance<T>(
  endpoint: string,
  method: string,
  fn: () => Promise<T>,
  user_id?: string
): Promise<T> {
  const startTime = Date.now();
  let statusCode = 200;
  let error: string | undefined;

  try {
    const result = await fn();
    return result;
  } catch (err) {
    statusCode = 500;
    error = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const duration = Date.now() - startTime;
    recordMetric(endpoint, method, duration, statusCode, user_id, error);
  }
}

/**
 * Вычисляет перцентили из массива чисел
 */
function calculatePercentiles(values: number[]): {
  p50: number;
  p95: number;
  p99: number;
} {
  if (values.length === 0) {
    return { p50: 0, p95: 0, p99: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const p50Index = Math.floor(sorted.length * 0.5);
  const p95Index = Math.floor(sorted.length * 0.95);
  const p99Index = Math.floor(sorted.length * 0.99);

  return {
    p50: sorted[p50Index] || 0,
    p95: sorted[p95Index] || 0,
    p99: sorted[p99Index] || 0,
  };
}

/**
 * Агрегирует метрики за период
 */
export function getAggregatedMetrics(
  endpoint?: string,
  method?: string,
  periodMinutes: number = 60
): AggregatedMetrics[] {
  const periodStart = new Date(Date.now() - periodMinutes * 60 * 1000);
  const filtered = metricsStore.filter((m) => {
    const matchesEndpoint = !endpoint || m.endpoint === endpoint;
    const matchesMethod = !method || m.method === method;
    const inPeriod = m.timestamp >= periodStart;
    return matchesEndpoint && matchesMethod && inPeriod;
  });

  // Группируем по endpoint и method
  const grouped = new Map<string, PerformanceMetrics[]>();

  for (const metric of filtered) {
    const key = `${metric.method}:${metric.endpoint}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(metric);
  }

  const result: AggregatedMetrics[] = [];

  for (const [key, metrics] of grouped.entries()) {
    const [method, endpoint] = key.split(":");
    const durations = metrics.map((m) => m.duration_ms);
    const percentiles = calculatePercentiles(durations);

    const successCount = metrics.filter((m) => m.status_code < 400).length;
    const errorCount = metrics.length - successCount;

    result.push({
      endpoint,
      method,
      total_requests: metrics.length,
      success_count: successCount,
      error_count: errorCount,
      avg_duration_ms: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50_duration_ms: percentiles.p50,
      p95_duration_ms: percentiles.p95,
      p99_duration_ms: percentiles.p99,
      min_duration_ms: Math.min(...durations),
      max_duration_ms: Math.max(...durations),
      period_start: periodStart,
      period_end: new Date(),
    });
  }

  return result;
}

/**
 * Получает метрики для конкретного эндпоинта
 */
export function getEndpointMetrics(
  endpoint: string,
  method: string,
  periodMinutes: number = 60
): AggregatedMetrics | null {
  const metrics = getAggregatedMetrics(endpoint, method, periodMinutes);
  return metrics[0] || null;
}

/**
 * Очищает старые метрики (старше указанного периода)
 */
export function cleanupOldMetrics(periodMinutes: number = 1440): void {
  const cutoff = new Date(Date.now() - periodMinutes * 60 * 1000);
  const initialLength = metricsStore.length;
  
  // Удаляем метрики старше cutoff
  while (metricsStore.length > 0 && metricsStore[0].timestamp < cutoff) {
    metricsStore.shift();
  }
  
  const removed = initialLength - metricsStore.length;
  if (removed > 0) {
    console.log(`Cleaned up ${removed} old metrics (older than ${periodMinutes} minutes)`);
  }
}

/**
 * Получает статистику офлайн-событий
 */
export function getOfflineEventsStats(): {
  total_unsynced: number;
  oldest_event: Date | null;
  newest_event: Date | null;
} {
  // В реальной реализации это должно запрашиваться из базы данных
  // Здесь возвращаем заглушку
  return {
    total_unsynced: 0,
    oldest_event: null,
    newest_event: null,
  };
}

