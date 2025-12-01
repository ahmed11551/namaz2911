// Edge Function для API эндпоинтов prayer-debt
// Обрабатывает: POST /calculate, GET /snapshot, PATCH /progress, GET /report.pdf

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

interface ProgressEntry {
  type: string;
  amount: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/prayer-debt-api", "");
    const method = req.method;

    // Получаем переменные окружения
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Создаем клиент Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Получаем user_id из заголовков или тела запроса
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      // Валидируем токен и получаем user_id
      // Для Telegram Mini App можно использовать initData
      // Пока используем токен напрямую как user_id (для демо)
      userId = token;
    }

    // Если нет токена, пытаемся получить из тела запроса
    if (!userId) {
      try {
        const body = await req.json();
        userId = body.user_id || null;
      } catch {
        // Если не JSON, продолжаем
      }
    }

    // Роутинг
    if (method === "POST" && path === "/calculate") {
      return await handleCalculate(req, supabase, userId);
    } else if (method === "GET" && path === "/snapshot") {
      return await handleSnapshot(req, supabase, userId);
    } else if (method === "PATCH" && path === "/progress") {
      return await handleProgress(req, supabase, userId);
    } else if (method === "GET" && path === "/report.pdf") {
      return await handleReportPDF(req, supabase, userId);
    } else if (method === "POST" && path === "/calculations") {
      return await handleAsyncCalculate(req, supabase, userId);
    } else if (method === "GET" && path.startsWith("/calculations/")) {
      const jobId = path.replace("/calculations/", "");
      return await handleCalculationStatus(req, supabase, userId, jobId);
    }
    // Роутинг для друзей
    else if (path === "/friends/code" && method === "POST") {
      return await handleGenerateFriendCode(req, supabase, userId);
    } else if (path === "/friends/code" && method === "GET") {
      return await handleGetFriendCode(req, supabase, userId);
    } else if (path === "/friends" && method === "POST") {
      return await handleAddFriend(req, supabase, userId);
    } else if (path === "/friends" && method === "GET") {
      return await handleGetFriends(req, supabase, userId);
    } else if (path.startsWith("/friends/") && path.endsWith("/compare") && method === "GET") {
      const friendId = path.replace("/friends/", "").replace("/compare", "");
      return await handleCompareFriend(req, supabase, userId, friendId);
    } else if (path.startsWith("/friends/") && method === "DELETE") {
      const friendId = path.replace("/friends/", "");
      return await handleRemoveFriend(req, supabase, userId, friendId);
    }
    // Webhook от e-Replika API
    else if (path === "/webhooks/prayer-debt" && method === "POST") {
      return await handleWebhook(req, supabase);
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// POST /calculate - Рассчитать долг намазов
async function handleCalculate(
  req: Request,
  supabase: SupabaseClient,
  userId: string | null
) {
  const body = await req.json();

  if (!userId) {
    userId = body.user_id || `user_${Date.now()}`;
  }

  // Валидация данных в зависимости от метода расчета
  if (body.calculation_method === "manual") {
    // Для ручного ввода нужны только missed_prayers и travel_prayers
    if (!body.missed_prayers && !body.travel_prayers) {
      return new Response(
        JSON.stringify({ error: "Missing missed_prayers or travel_prayers for manual calculation" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } else {
    // Для калькулятора нужны personal_data и travel_data
    if (!body.personal_data || !body.travel_data) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  // Формируем debt_calculation в зависимости от метода
  let debtCalculation = body.debt_calculation;
  
  if (body.calculation_method === "manual" && !debtCalculation) {
    // Создаем debt_calculation из ручного ввода
    const now = new Date();
    debtCalculation = {
      period: {
        start: now,
        end: now,
      },
      total_days: 0,
      excluded_days: 0,
      effective_days: 0,
      missed_prayers: body.missed_prayers || {
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0,
        witr: 0,
      },
      travel_prayers: body.travel_prayers || {
        dhuhr_safar: 0,
        asr_safar: 0,
        isha_safar: 0,
      },
    };
  }

  // Здесь должна быть логика расчета через prayer-calculator
  // Пока сохраняем данные как есть (расчет делается на фронтенде)
  const debtData = {
    user_id: userId,
    calc_version: "1.0.0",
    madhab: body.madhab || "hanafi",
    calculation_method: body.calculation_method || "calculator",
    personal_data: body.personal_data || {
      birth_date: new Date(),
      gender: "male",
      bulugh_age: 15,
      bulugh_date: new Date(),
      prayer_start_date: new Date(),
      today_as_start: true,
    },
    women_data: body.women_data || null,
    travel_data: body.travel_data || {
      total_travel_days: 0,
      travel_periods: [],
    },
    debt_calculation: debtCalculation || {},
    repayment_progress: body.repayment_progress || {
      completed_prayers: {
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0,
        witr: 0,
      },
      last_updated: new Date().toISOString(),
    },
  };

  // Сохраняем или обновляем в БД
  const { data, error } = await supabase
    .from("prayer_debts")
    .upsert(
      {
        user_id: userId,
        calc_version: debtData.calc_version,
        madhab: debtData.madhab,
        calculation_method: debtData.calculation_method,
        personal_data: debtData.personal_data,
        women_data: debtData.women_data,
        travel_data: debtData.travel_data,
        debt_calculation: debtData.debt_calculation,
        repayment_progress: debtData.repayment_progress,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// GET /snapshot - Получить последний расчет и прогресс
async function handleSnapshot(
  req: Request,
  supabase: SupabaseClient,
  userId: string | null
) {
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "user_id required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const { data, error } = await supabase
    .from("prayer_debts")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // Not found
      return new Response(
        JSON.stringify({ error: "No data found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    throw error;
  }

  // Формируем DebtSnapshot
  const snapshot = {
    user_id: data.user_id,
    debt_calculation: data.debt_calculation,
    repayment_progress: data.repayment_progress,
    overall_progress_percent: 0, // Рассчитывается на фронтенде
    remaining_prayers: {}, // Рассчитывается на фронтенде
  };

  return new Response(JSON.stringify(snapshot), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// PATCH /progress - Обновить прогресс восполнения
async function handleProgress(
  req: Request,
  supabase: SupabaseClient,
  userId: string | null
) {
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "user_id required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const body = await req.json();

  // Получаем текущие данные
  const { data: currentData, error: fetchError } = await supabase
    .from("prayer_debts")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // Обновляем прогресс
  const currentProgress = currentData.repayment_progress || {
    completed_prayers: {
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
      witr: 0,
    },
    last_updated: new Date().toISOString(),
  };

  // Применяем обновления из body.entries
  if (body.entries && Array.isArray(body.entries)) {
    body.entries.forEach((entry: ProgressEntry) => {
      if (currentProgress.completed_prayers[entry.type] !== undefined) {
        currentProgress.completed_prayers[entry.type] += entry.amount;
      }
    });
  }

  currentProgress.last_updated = new Date().toISOString();

  // Сохраняем обновленный прогресс
  const { data, error } = await supabase
    .from("prayer_debts")
    .update({
      repayment_progress: currentProgress,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(data.repayment_progress), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// GET /report.pdf - Скачать PDF отчет
async function handleReportPDF(
  req: Request,
  supabase: SupabaseClient,
  userId: string | null
) {
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "user_id required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Получаем данные
  const { data, error } = await supabase
    .from("prayer_debts")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  // Пока возвращаем JSON (PDF генерация через e-Replika API)
  // В будущем можно добавить генерацию PDF здесь
  return new Response(
    JSON.stringify({
      message: "PDF generation not implemented yet. Use e-Replika API.",
      data: data,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// POST /calculations - Асинхронный расчет
async function handleAsyncCalculate(
  req: Request,
  supabase: SupabaseClient,
  userId: string | null
) {
  if (!userId) {
    userId = `user_${Date.now()}`;
  }

  const body = await req.json();
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Создаем задачу
  const { data, error } = await supabase
    .from("calculation_jobs")
    .insert({
      job_id: jobId,
      user_id: userId,
      status: "pending",
      payload: body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Отправляем задачу в e-Replika API для асинхронной обработки
  try {
    const webhookUrl = Deno.env.get("WEB_APP_URL") || "https://namaz2911.vercel.app";
    const webhookEndpoint = `${webhookUrl}/api/prayer-debt/webhooks/prayer-debt`;
    
    // Вызываем e-Replika API для асинхронного расчета
    const ereplikaApiUrl = Deno.env.get("EREPLIKA_API_URL") || "https://bot.e-replika.ru/api";
    const ereplikaResponse = await fetch(`${ereplikaApiUrl}/prayer-debt/calculate-async`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("EREPLIKA_API_TOKEN") || "test_token_123"}`,
      },
      body: JSON.stringify({
        job_id: jobId,
        user_id: userId,
        calculation_request: body,
        webhook_url: webhookEndpoint,
      }),
    });

    if (ereplikaResponse.ok) {
      // e-Replika принял задачу, обновим статус
      await supabase
        .from("calculation_jobs")
        .update({
          status: "processing",
          updated_at: new Date().toISOString(),
        })
        .eq("job_id", jobId);
    } else {
      console.warn("e-Replika API не принял задачу, расчет будет выполнен локально");
      // Можно запустить локальный расчет или оставить pending
    }
  } catch (error) {
    console.warn("Ошибка при отправке в e-Replika API:", error);
    // Продолжаем работу, расчет может быть выполнен локально
  }

  return new Response(
    JSON.stringify({
      job_id: jobId,
      status_url: `/api/prayer-debt/calculations/${jobId}`,
    }),
    {
      status: 202,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// GET /calculations/:jobId - Статус асинхронного расчета
async function handleCalculationStatus(
  req: Request,
  supabase: SupabaseClient,
  userId: string | null,
  jobId: string
) {
  const { data, error } = await supabase
    .from("calculation_jobs")
    .select("*")
    .eq("job_id", jobId)
    .single();

  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify({
      status: data.status,
      result: data.result,
      error: data.error,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// POST /friends/code - Генерация кода для добавления друзей
async function handleGenerateFriendCode(
  req: Request,
  supabase: SupabaseClient,
  userId: string | null
) {
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "user_id required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Генерируем уникальный код
    const code = `FRD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // Сохраняем в БД (если есть таблица friend_codes)
    // Пока возвращаем код напрямую
    const friendCode = {
      code,
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(friendCode), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    throw error;
  }
}

// GET /friends/code - Получить свой код друга
async function handleGetFriendCode(
  req: Request,
  supabase: SupabaseClient,
  userId: string | null
) {
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "user_id required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Генерируем код, если его нет
    const code = `FRD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const friendCode = {
      code,
      user_id: userId,
      created_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(friendCode), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    throw error;
  }
}

// POST /friends - Добавить друга по коду
async function handleAddFriend(
  req: Request,
  supabase: SupabaseClient,
  userId: string | null
) {
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "user_id required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await req.json();
    const friendCode = body.friend_code;

    if (!friendCode) {
      return new Response(
        JSON.stringify({ error: "friend_code required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // В реальном приложении здесь должна быть валидация кода и поиск пользователя
    // Пока возвращаем успешный ответ с mock данными
    const friend = {
      id: `friend_${Date.now()}`,
      user_id: userId,
      friend_user_id: `friend_user_${friendCode}`,
      friend_name: "Друг",
      friend_progress: {
        overall_progress: 0,
        total_completed: 0,
        total_missed: 0,
        daily_pace: 0,
        current_streak: 0,
        achievements_count: 0,
        last_updated: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return new Response(
      JSON.stringify({ success: true, friend }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    throw error;
  }
}

// GET /friends - Получить список друзей
async function handleGetFriends(
  req: Request,
  supabase: SupabaseClient,
  userId: string | null
) {
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "user_id required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // В реальном приложении здесь должен быть запрос к БД
    // Пока возвращаем пустой список
    return new Response(
      JSON.stringify({ friends: [], total: 0 }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    throw error;
  }
}

// GET /friends/{id}/compare - Сравнить прогресс с другом
async function handleCompareFriend(
  req: Request,
  supabase: SupabaseClient,
  userId: string | null,
  friendId: string
) {
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "user_id required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // В реальном приложении здесь должен быть расчет сравнения
    // Пока возвращаем mock данные
    const comparison = {
      your_progress: {
        overall_progress: 0,
        total_completed: 0,
        total_missed: 0,
        daily_pace: 0,
        current_streak: 0,
        achievements_count: 0,
        last_updated: new Date().toISOString(),
      },
      friend_progress: {
        overall_progress: 0,
        total_completed: 0,
        total_missed: 0,
        daily_pace: 0,
        current_streak: 0,
        achievements_count: 0,
        last_updated: new Date().toISOString(),
      },
      difference: {
        progress_diff: 0,
        completed_diff: 0,
        pace_diff: 0,
        streak_diff: 0,
      },
    };

    return new Response(JSON.stringify(comparison), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    throw error;
  }
}

// DELETE /friends/{id} - Удалить друга
async function handleRemoveFriend(
  req: Request,
  supabase: SupabaseClient,
  userId: string | null,
  friendId: string
) {
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "user_id required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // В реальном приложении здесь должно быть удаление из БД
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    throw error;
  }
}

// POST /webhooks/prayer-debt - Webhook от e-Replika API
async function handleWebhook(
  req: Request,
  supabase: SupabaseClient
) {
  try {
    // Получаем тело запроса от e-Replika
    const body = await req.json();
    
    // Валидация webhook (можно добавить проверку подписи)
    const webhookSecret = Deno.env.get("EREPLIKA_WEBHOOK_SECRET");
    const receivedSecret = req.headers.get("X-Webhook-Secret");
    
    if (webhookSecret && receivedSecret !== webhookSecret) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook secret" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Обрабатываем разные типы webhook событий
    const eventType = body.event_type || body.type;
    const jobId = body.job_id || body.calculation_id;

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: "job_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Находим задачу расчета
    const { data: job, error: jobError } = await supabase
      .from("calculation_jobs")
      .select("*")
      .eq("job_id", jobId)
      .single();

    if (jobError || !job) {
      console.warn(`Job ${jobId} not found`);
      // Возвращаем 200, чтобы e-Replika не повторял запрос
      return new Response(
        JSON.stringify({ received: true, message: "Job not found" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Обрабатываем событие в зависимости от типа
    switch (eventType) {
      case "calculation.completed":
      case "done":
      case "success":
        // Расчет завершен успешно
        const result = body.result || body.data || body.calculation;
        
        // Обновляем статус задачи
        await supabase
          .from("calculation_jobs")
          .update({
            status: "done",
            result: result,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("job_id", jobId);

        // Сохраняем результат в prayer_debts, если есть user_id
        if (job.user_id && result) {
          try {
            await supabase
              .from("prayer_debts")
              .upsert(
                {
                  user_id: job.user_id,
                  calc_version: result.calc_version || "1.0.0",
                  madhab: result.madhab || "hanafi",
                  calculation_method: result.calculation_method || "calculator",
                  personal_data: result.personal_data,
                  women_data: result.women_data,
                  travel_data: result.travel_data,
                  debt_calculation: result.debt_calculation,
                  repayment_progress: result.repayment_progress || {
                    completed_prayers: {
                      fajr: 0,
                      dhuhr: 0,
                      asr: 0,
                      maghrib: 0,
                      isha: 0,
                      witr: 0,
                    },
                    last_updated: new Date().toISOString(),
                  },
                  updated_at: new Date().toISOString(),
                },
                {
                  onConflict: "user_id",
                }
              );
          } catch (error) {
            console.error("Error saving calculation result:", error);
            // Продолжаем, даже если сохранение не удалось
          }
        }

        return new Response(
          JSON.stringify({ received: true, status: "processed" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );

      case "calculation.failed":
      case "error":
      case "failed":
        // Расчет завершился с ошибкой
        const errorMessage = body.error || body.message || "Calculation failed";

        await supabase
          .from("calculation_jobs")
          .update({
            status: "error",
            error: errorMessage,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("job_id", jobId);

        return new Response(
          JSON.stringify({ received: true, status: "error_processed" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );

      case "calculation.progress":
      case "progress":
        // Обновление прогресса расчета
        const progress = body.progress || body.percentage || 0;

        await supabase
          .from("calculation_jobs")
          .update({
            progress: progress,
            updated_at: new Date().toISOString(),
          })
          .eq("job_id", jobId);

        return new Response(
          JSON.stringify({ received: true, status: "progress_updated" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );

      default:
        // Неизвестный тип события - просто подтверждаем получение
        console.log(`Unknown webhook event type: ${eventType}`);
        return new Response(
          JSON.stringify({ received: true, status: "unknown_event" }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Всегда возвращаем 200, чтобы e-Replika не повторял запрос
    // Логируем ошибку для отладки
    return new Response(
      JSON.stringify({ 
        received: true, 
        error: error.message || "Internal error",
        status: "error_logged"
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

