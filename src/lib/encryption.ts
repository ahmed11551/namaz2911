// Утилита для шифрования данных AES-256 согласно ТЗ
// Использует Web Crypto API для безопасного шифрования персональных данных

/**
 * Генерация ключа шифрования на основе user_id
 * Использует PBKDF2 для получения ключа из пароля
 */
async function deriveKey(userId: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const password = encoder.encode(userId);
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    password,
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Генерация случайной соли
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Шифрование данных AES-256-GCM
 */
export async function encryptData(
  data: string,
  userId: string
): Promise<{ encrypted: string; salt: string; iv: string }> {
  try {
    // Генерируем соль и IV
    const salt = generateSalt();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes для GCM

    // Получаем ключ
    const key = await deriveKey(userId, salt);

    // Шифруем данные
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      dataBuffer
    );

    // Конвертируем в base64 для хранения
    const encrypted = btoa(
      String.fromCharCode(...new Uint8Array(encryptedBuffer))
    );
    const saltBase64 = btoa(String.fromCharCode(...salt));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return {
      encrypted,
      salt: saltBase64,
      iv: ivBase64,
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Не удалось зашифровать данные");
  }
}

/**
 * Дешифрование данных AES-256-GCM
 */
export async function decryptData(
  encryptedData: { encrypted: string; salt: string; iv: string },
  userId: string
): Promise<string> {
  try {
    // Декодируем из base64
    const salt = Uint8Array.from(atob(encryptedData.salt), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(encryptedData.iv), (c) => c.charCodeAt(0));
    const encrypted = Uint8Array.from(
      atob(encryptedData.encrypted),
      (c) => c.charCodeAt(0)
    );

    // Получаем ключ
    const key = await deriveKey(userId, salt);

    // Дешифруем данные
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encrypted
    );

    // Конвертируем в строку
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Не удалось расшифровать данные. Возможно, данные повреждены или ключ неверный.");
  }
}

/**
 * Проверка, зашифрованы ли данные
 */
export function isEncrypted(data: string): boolean {
  try {
    const parsed = JSON.parse(data);
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      "encrypted" in parsed &&
      "salt" in parsed &&
      "iv" in parsed
    );
  } catch {
    return false;
  }
}

/**
 * Получение user_id для шифрования
 * Использует Telegram user_id или генерирует на основе localStorage
 */
export function getEncryptionUserId(): string {
  // Пытаемся получить Telegram user_id
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    const initData = window.Telegram.WebApp.initData;
    if (initData) {
      // Извлекаем user_id из initData
      const params = new URLSearchParams(initData);
      const userStr = params.get("user");
      if (userStr) {
        try {
          const user = JSON.parse(decodeURIComponent(userStr));
          if (user.id) {
            return `telegram_${user.id}`;
          }
        } catch {
          // Игнорируем ошибки парсинга
        }
      }
    }
  }

  // Fallback: используем сохраненный user_id или генерируем новый
  let userId = localStorage.getItem("encryption_user_id");
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem("encryption_user_id", userId);
  }

  return userId;
}

