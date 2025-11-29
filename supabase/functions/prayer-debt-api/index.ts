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
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // В реальном приложении здесь должна быть асинхронная обработка
  // Пока возвращаем job_id

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

