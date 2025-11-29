// Утилиты для обработки ошибок

// Коды ошибок API
export const API_ERROR_CODES = {
  NETWORK_ERROR: "NETWORK_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  SERVER_ERROR: "SERVER_ERROR",
  TIMEOUT: "TIMEOUT",
  UNKNOWN: "UNKNOWN",
} as const;

export type APIErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

// Базовый класс ошибки API
export class APIError extends Error {
  constructor(
    message: string,
    public code: APIErrorCode = API_ERROR_CODES.UNKNOWN,
    public statusCode?: number,
    public details?: Record<string, unknown>,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = "APIError";
  }

  // Локализованное сообщение для пользователя
  get userMessage(): string {
    switch (this.code) {
      case API_ERROR_CODES.NETWORK_ERROR:
        return "Нет подключения к интернету. Проверьте соединение и попробуйте снова.";
      case API_ERROR_CODES.UNAUTHORIZED:
        return "Сессия истекла. Пожалуйста, войдите снова.";
      case API_ERROR_CODES.FORBIDDEN:
        return "У вас нет доступа к этому ресурсу.";
      case API_ERROR_CODES.NOT_FOUND:
        return "Запрашиваемые данные не найдены.";
      case API_ERROR_CODES.VALIDATION_ERROR:
        return "Проверьте правильность введённых данных.";
      case API_ERROR_CODES.SERVER_ERROR:
        return "Ошибка сервера. Пожалуйста, попробуйте позже.";
      case API_ERROR_CODES.TIMEOUT:
        return "Превышено время ожидания. Попробуйте ещё раз.";
      default:
        return this.message || "Произошла неизвестная ошибка.";
    }
  }
}

// Специализированные ошибки
export class PrayerDebtError extends APIError {
  constructor(
    message: string,
    code?: APIErrorCode,
    statusCode?: number
  ) {
    super(message, code, statusCode);
    this.name = "PrayerDebtError";
  }
}

export class NetworkError extends APIError {
  constructor(message: string = "Ошибка сети") {
    super(message, API_ERROR_CODES.NETWORK_ERROR, 0, undefined, true);
    this.name = "NetworkError";
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, API_ERROR_CODES.VALIDATION_ERROR, 400, details, false);
    this.name = "ValidationError";
  }
}

// Обработка ответа API
export async function handleAPIResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json();
    }
    return response.text() as unknown as T;
  }

  let errorData: { error?: string; code?: string; details?: Record<string, unknown> } = {};
  
  try {
    errorData = await response.json();
  } catch {
    errorData = { error: response.statusText };
  }

  const code = getErrorCodeFromStatus(response.status);
  const isRetryable = response.status >= 500 || response.status === 429;

  throw new APIError(
    errorData.error || `HTTP Error ${response.status}`,
    code,
    response.status,
    errorData.details,
    isRetryable
  );
}

// Получить код ошибки из HTTP статуса
function getErrorCodeFromStatus(status: number): APIErrorCode {
  switch (status) {
    case 400:
      return API_ERROR_CODES.VALIDATION_ERROR;
    case 401:
      return API_ERROR_CODES.UNAUTHORIZED;
    case 403:
      return API_ERROR_CODES.FORBIDDEN;
    case 404:
      return API_ERROR_CODES.NOT_FOUND;
    case 408:
    case 504:
      return API_ERROR_CODES.TIMEOUT;
    default:
      if (status >= 500) {
        return API_ERROR_CODES.SERVER_ERROR;
      }
      return API_ERROR_CODES.UNKNOWN;
  }
}

// Обёртка для fetch с таймаутом и retry
export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  config: {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
  } = {}
): Promise<T> {
  const { timeout = 10000, retries = 2, retryDelay = 1000 } = config;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return await handleAPIResponse<T>(response);
      
    } catch (error) {
      lastError = error as Error;
      
      // Проверяем, можно ли повторить запрос
      const isRetryable = 
        error instanceof APIError && error.isRetryable ||
        isNetworkError(error) ||
        (error as Error).name === "AbortError";
      
      if (!isRetryable || attempt === retries) {
        break;
      }
      
      // Ждём перед повтором
      await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
    }
  }
  
  // Преобразуем ошибку если нужно
  if (lastError) {
    if (lastError.name === "AbortError") {
      throw new APIError("Превышено время ожидания", API_ERROR_CODES.TIMEOUT, 408, undefined, true);
    }
    if (isNetworkError(lastError)) {
      throw new NetworkError(lastError.message);
    }
    throw lastError;
  }
  
  throw new APIError("Неизвестная ошибка", API_ERROR_CODES.UNKNOWN);
}

// Извлечь сообщение об ошибке
export function handleAPIError(error: unknown): string {
  if (error instanceof APIError) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    if (isNetworkError(error)) {
      return "Нет подключения к интернету";
    }
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }

  return "Произошла неизвестная ошибка";
}

// Проверка на сетевую ошибку
export function isNetworkError(error: unknown): boolean {
  if (error instanceof NetworkError) {
    return true;
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("failed to fetch") ||
      message.includes("net::") ||
      message.includes("networkerror") ||
      error.name === "TypeError" && message.includes("fetch")
    );
  }
  return false;
}

// Логирование ошибок (для отладки)
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const prefix = context ? `[${context}]` : "";
  
  if (error instanceof APIError) {
    console.error(`${timestamp} ${prefix} APIError:`, {
      message: error.message,
      code: error.code,
      status: error.statusCode,
      details: error.details,
      retryable: error.isRetryable,
    });
  } else if (error instanceof Error) {
    console.error(`${timestamp} ${prefix} Error:`, error.message, error.stack);
  } else {
    console.error(`${timestamp} ${prefix} Unknown error:`, error);
  }
}

