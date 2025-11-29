// Edge Function для ежедневного сброса прогресса азкаров
// Вызывается по расписанию (cron) в 00:00 по локальному времени каждого пользователя
// Для каждого пользователя создается новая запись daily_azkar на новый день

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Вспомогательная функция для получения текущей даты в часовом поясе пользователя
function getLocalDate(tz: string): string {
  try {
    // Используем Intl.DateTimeFormat для конвертации времени в локальный часовой пояс
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now);
  } catch (error) {
    console.error(`Error formatting date for timezone ${tz}:`, error);
    // Fallback на UTC
    return new Date().toISOString().split("T")[0];
  }
}

// Проверка, нужно ли сбрасывать азкары для пользователя
// Возвращает true, если в часовом поясе пользователя сейчас 00:00-00:05
function shouldResetForUser(tz: string): boolean {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0");
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0");
    
    // Сбрасываем в период 00:00-00:05 (5-минутное окно для надежности)
    return hour === 0 && minute <= 5;
  } catch (error) {
    console.error(`Error checking reset time for timezone ${tz}:`, error);
    return false;
  }
}

// Сброс азкаров для одного пользователя
async function resetAzkarForUser(
  supabase: SupabaseClient,
  userId: string,
  tz: string
): Promise<void> {
  try {
    const localDate = getLocalDate(tz);
    
    // Проверяем, существует ли уже запись на сегодня
    const { data: existing } = await supabase
      .from("daily_azkar")
      .select("*")
      .eq("user_id", userId)
      .eq("date_local", localDate)
      .single();

    if (existing) {
      // Запись уже существует, пропускаем
      console.log(`Daily azkar already exists for user ${userId} on ${localDate}`);
      return;
    }

    // Создаем новую запись на сегодня
    const { error } = await supabase.from("daily_azkar").insert({
      user_id: userId,
      date_local: localDate,
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
      total: 0,
      is_complete: false,
    });

    if (error) {
      console.error(`Error resetting azkar for user ${userId}:`, error);
      throw error;
    }

    console.log(`Successfully reset azkar for user ${userId} on ${localDate}`);
  } catch (error) {
    console.error(`Error in resetAzkarForUser for ${userId}:`, error);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Проверяем секретный ключ для безопасности (если используется cron)
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Получаем переменные окружения
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Создаем клиент Supabase с service role key для доступа ко всем данным
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Получаем всех пользователей
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, tz");

    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users found", reset_count: 0 }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Сбрасываем азкары для каждого пользователя, у которого сейчас 00:00
    const results = [];
    let resetCount = 0;

    for (const user of users) {
      const userTz = user.tz || "UTC";
      
      // Проверяем, нужно ли сбрасывать для этого пользователя
      if (shouldResetForUser(userTz)) {
        try {
          await resetAzkarForUser(supabase, user.id, userTz);
          resetCount++;
          results.push({ user_id: user.id, status: "reset", tz: userTz });
        } catch (error) {
          results.push({
            user_id: user.id,
            status: "error",
            error: error.message,
            tz: userTz,
          });
        }
      } else {
        results.push({
          user_id: user.id,
          status: "skipped",
          reason: "not_reset_time",
          tz: userTz,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Daily azkar reset completed",
        reset_count: resetCount,
        total_users: users.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in daily azkar reset:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

