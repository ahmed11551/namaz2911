// Утилита для тестирования e-Replika API
// Используйте в консоли браузера для диагностики проблем с аудио

export async function testEReplikaAudioAPI(duaId: string = "1") {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://bot.e-replika.ru/api";
  const token = import.meta.env.VITE_API_TOKEN || "test_token_123";
  
  console.log("🔍 Тестирование e-Replika API для аудио...");
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Token: ${token}`);
  console.log(`Dua ID: ${duaId}`);
  
  const endpoints = [
    `${API_BASE_URL}/duas/${duaId}/audio`,
    `${API_BASE_URL}/audio/dua/${duaId}`,
    `${API_BASE_URL}/dua/${duaId}/audio`,
  ];
  
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
  
  for (const endpoint of endpoints) {
    console.log(`\n📡 Пробуем: ${endpoint}`);
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers,
      });
      
      console.log(`   Статус: ${response.status} ${response.statusText}`);
      console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        console.log(`   Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes("audio/")) {
          console.log(`   ✅ Найдено аудио! URL: ${endpoint}`);
          return endpoint;
        } else {
          const text = await response.text();
          console.log(`   Ответ (первые 200 символов):`, text.substring(0, 200));
          
          try {
            const json = JSON.parse(text);
            console.log(`   JSON ответ:`, json);
            if (json.audio_url || json.url) {
              console.log(`   ✅ Найден URL аудио: ${json.audio_url || json.url}`);
              return json.audio_url || json.url;
            }
          } catch {
            // Не JSON
          }
        }
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Ошибка: ${errorText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   ❌ Исключение:`, error);
    }
  }
  
  console.log(`\n❌ Аудио не найдено ни на одном эндпоинте`);
  return null;
}

// Тест получения списка дуа
export async function testEReplikaDuasList() {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://bot.e-replika.ru/api";
  const token = import.meta.env.VITE_API_TOKEN || "test_token_123";
  
  console.log("🔍 Тестирование получения списка дуа...");
  
  const endpoint = `${API_BASE_URL}/duas`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  };
  
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers,
    });
    
    console.log(`Статус: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Получен список дуа:`, data);
      return data;
    } else {
      const errorText = await response.text();
      console.log(`❌ Ошибка: ${errorText}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Исключение:`, error);
    return null;
  }
}

// Добавляем в window для использования в консоли
if (typeof window !== "undefined") {
  const win = window as Window & {
    testEReplikaAudioAPI?: typeof testEReplikaAudioAPI;
    testEReplikaDuasList?: typeof testEReplikaDuasList;
  };
  win.testEReplikaAudioAPI = testEReplikaAudioAPI;
  win.testEReplikaDuasList = testEReplikaDuasList;
  
  console.log(`
  🛠️  Утилиты для тестирования API доступны в консоли:
  
  testEReplikaAudioAPI("1")  - тест загрузки аудио для дуа с ID "1"
  testEReplikaDuasList()     - получение списка всех дуа из API
  
  Пример использования:
  await testEReplikaAudioAPI("sleep-1")
  await testEReplikaDuasList()
  `);
}

