// Edge Function для API умного тасбиха
// Обрабатывает: bootstrap, goals, sessions, counter/tap, learn/mark, reports

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

// Типы для данных
interface RequestBody {
  user_id?: string;
  [key: string]: unknown;
}

interface GoalBody {
  category: string;
  item_id?: string;
  goal_type: "recite" | "learn";
  target_count: number;
  prayer_segment?: string;
}

interface SessionBody {
  goal_id?: string;
  category: string;
  item_id?: string;
  prayer_segment?: string;
}

interface CounterTapBody {
  session_id: string;
  delta: number;
  event_type: string;
  offline_id?: string;
  prayer_segment?: string;
}

interface MarkLearnedBody {
  goal_id: string;
}

interface SyncOfflineBody {
  events: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
    timestamp: string;
  }>;
}

interface RecentItem {
  id: string;
  title: string;
  category: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/smart-tasbih-api", "");
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

    // Получаем user_id из заголовков
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      userId = token;
    }

    // Для POST запросов получаем body
    let requestBody: RequestBody | null = null;
    if (method === "POST" || method === "PUT") {
      try {
        requestBody = await req.json();
        if (!userId && requestBody.user_id) {
          userId = requestBody.user_id;
        }
      } catch {
        // Если не JSON, продолжаем
      }
    }

    if (!userId) {
      // Для GET запросов используем токен из заголовка или дефолтный
      userId = authHeader?.substring(7) || "unknown";
    }

    // Роутинг
    if (path === "/bootstrap" && method === "GET") {
      return await handleBootstrap(supabase, userId);
    } else if (path === "/goals" && method === "POST") {
      return await handleCreateOrUpdateGoal(requestBody, supabase, userId);
    } else if (path === "/sessions/start" && method === "POST") {
      return await handleStartSession(requestBody, supabase, userId);
    } else if (path === "/counter/tap" && method === "POST") {
      return await handleCounterTap(requestBody, supabase, userId);
    } else if (path === "/learn/mark" && method === "POST") {
      return await handleMarkLearned(requestBody, supabase, userId);
    } else if (path === "/reports/daily" && method === "GET") {
      return await handleDailyReport(req, supabase, userId);
    } else if (path === "/sync/offline" && method === "POST") {
      return await handleSyncOffline(requestBody, supabase, userId);
    } else {
      return new Response(
        JSON.stringify({ error: "Not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
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

// Bootstrap - получение состояния для инициализации
async function handleBootstrap(supabase: SupabaseClient, userId: string) {
  try {
    // Получаем активную цель
    const { data: activeGoal } = await supabase
      .from("tasbih_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Получаем ежедневные азкары
    const today = new Date().toISOString().split("T")[0];
    const { data: dailyAzkar } = await supabase
      .from("daily_azkar")
      .select("*")
      .eq("user_id", userId)
      .eq("date_local", today)
      .single();

    // Если нет записи, создаем
    let azkar = dailyAzkar;
    if (!azkar) {
      const { data: newAzkar } = await supabase
        .from("daily_azkar")
        .insert({
          user_id: userId,
          date_local: today,
          fajr: 0,
          dhuhr: 0,
          asr: 0,
          maghrib: 0,
          isha: 0,
          total: 0,
          is_complete: false,
        })
        .select()
        .single();
      azkar = newAzkar;
    }

    // Получаем последние элементы (можно расширить)
    const recentItems: RecentItem[] = [];

    return new Response(
      JSON.stringify({
        user: {
          id: userId,
          locale: "ru",
          madhab: "hanafi",
          tz: "Europe/Moscow",
        },
        active_goal: activeGoal || null,
        daily_azkar: azkar || null,
        recent_items: recentItems,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in bootstrap:", error);
    throw error;
  }
}

// Создание/обновление цели
async function handleCreateOrUpdateGoal(body: GoalBody, supabase: SupabaseClient, userId: string) {
  try {
    const { category, item_id, goal_type, target_count, prayer_segment } = body;

    // Проверяем, есть ли уже активная цель для этого сегмента
    let existingGoal = null;
    if (prayer_segment && prayer_segment !== "none") {
      const { data } = await supabase
        .from("tasbih_goals")
        .select("*")
        .eq("user_id", userId)
        .eq("category", category)
        .eq("prayer_segment", prayer_segment)
        .eq("status", "active")
        .single();
      existingGoal = data;
    }

    let goal;
    if (existingGoal) {
      // Обновляем существующую цель
      const { data } = await supabase
        .from("tasbih_goals")
        .update({
          target_count,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingGoal.id)
        .select()
        .single();
      goal = data;
    } else {
      // Создаем новую цель
      const { data } = await supabase
        .from("tasbih_goals")
        .insert({
          user_id: userId,
          category,
          item_id: item_id || null,
          goal_type,
          target_count,
          progress: 0,
          status: "active",
          prayer_segment: prayer_segment || "none",
        })
        .select()
        .single();
      goal = data;
    }

    return new Response(
      JSON.stringify(goal),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating goal:", error);
    throw error;
  }
}

// Начало сессии
async function handleStartSession(body: SessionBody, supabase: SupabaseClient, userId: string) {
  try {
    const { goal_id, category, item_id, prayer_segment } = body;

    // Завершаем предыдущую активную сессию, если есть
    await supabase
      .from("tasbih_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("ended_at", null);

    // Создаем новую сессию
    const { data: session } = await supabase
      .from("tasbih_sessions")
      .insert({
        user_id: userId,
        goal_id: goal_id || null,
        prayer_segment: prayer_segment || "none",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    return new Response(
      JSON.stringify(session),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error starting session:", error);
    throw error;
  }
}

// Фиксация действия (tap)
async function handleCounterTap(body: CounterTapBody, supabase: SupabaseClient, userId: string) {
  try {
    const { session_id, delta, event_type, offline_id, prayer_segment } = body;

    // Получаем сессию
    const { data: session } = await supabase
      .from("tasbih_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (!session) {
      throw new Error("Session not found");
    }

    // Получаем цель, если есть
    let goal = null;
    if (session.goal_id) {
      const { data } = await supabase
        .from("tasbih_goals")
        .select("*")
        .eq("id", session.goal_id)
        .single();
      goal = data;
    }

    // Обновляем прогресс цели
    let newProgress = 0;
    let isCompleted = false;
    if (goal) {
      newProgress = Math.max(0, goal.progress + delta);
      isCompleted = newProgress >= goal.target_count;

      await supabase
        .from("tasbih_goals")
        .update({
          progress: newProgress,
          status: isCompleted ? "completed" : "active",
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id);
    }

    // Обновляем daily_azkar, если это азкары
    let dailyAzkar = null;
    if (prayer_segment && prayer_segment !== "none") {
      const today = new Date().toISOString().split("T")[0];
      const { data: azkar } = await supabase
        .from("daily_azkar")
        .select("*")
        .eq("user_id", userId)
        .eq("date_local", today)
        .single();

      if (azkar) {
        const field = prayer_segment as keyof typeof azkar;
        const currentValue = (azkar[field] as number) || 0;
        const newValue = Math.max(0, currentValue + delta);

        const { data: updated } = await supabase
          .from("daily_azkar")
          .update({
            [field]: newValue,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
          .eq("date_local", today)
          .select()
          .single();
        dailyAzkar = updated;
      }
    }

    // Записываем в лог
    const valueAfter = goal ? newProgress : (session.progress || 0) + delta;
    await supabase.from("dhikr_log").insert({
      user_id: userId,
      session_id,
      goal_id: goal?.id || null,
      category: goal?.category || null,
      item_id: goal?.item_id || null,
      event_type: event_type || "tap",
      delta,
      value_after: valueAfter,
      prayer_segment: prayer_segment || "none",
      at_ts: new Date().toISOString(),
      tz: "Europe/Moscow", // TODO: получать из users.tz
      offline_id: offline_id || null,
      suspected: false, // TODO: проверка на аномальную активность
    });

    return new Response(
      JSON.stringify({
        value_after: valueAfter,
        goal_progress: goal ? {
          goal_id: goal.id,
          progress: newProgress,
          is_completed: isCompleted,
        } : null,
        daily_azkar,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in counter tap:", error);
    throw error;
  }
}

// Отметка о заучивании
async function handleMarkLearned(body: MarkLearnedBody, supabase: SupabaseClient, userId: string) {
  try {
    const { goal_id } = body;

    const { data: goal } = await supabase
      .from("tasbih_goals")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", goal_id)
      .eq("user_id", userId)
      .select()
      .single();

    // Записываем в лог
    await supabase.from("dhikr_log").insert({
      user_id: userId,
      goal_id,
      category: goal.category,
      item_id: goal.item_id,
      event_type: "learn_mark",
      delta: 0,
      value_after: goal.progress,
      prayer_segment: goal.prayer_segment,
      at_ts: new Date().toISOString(),
      tz: "Europe/Moscow",
    });

    return new Response(
      JSON.stringify(goal),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error marking learned:", error);
    throw error;
  }
}

// Ежедневный отчет
async function handleDailyReport(req: Request, supabase: SupabaseClient, userId: string) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Получаем daily_azkar
    const { data: dailyAzkar } = await supabase
      .from("daily_azkar")
      .select("*")
      .eq("user_id", userId)
      .eq("date_local", date)
      .single();

    // Получаем завершенные цели за день
    const { data: completedGoals } = await supabase
      .from("tasbih_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .gte("completed_at", `${date}T00:00:00`)
      .lte("completed_at", `${date}T23:59:59`);

    // Подсчитываем общее количество зикров за день
    const { data: logs } = await supabase
      .from("dhikr_log")
      .select("delta")
      .eq("user_id", userId)
      .gte("at_ts", `${date}T00:00:00`)
      .lte("at_ts", `${date}T23:59:59`)
      .eq("event_type", "tap");

    const totalDhikrCount = logs?.reduce((sum, log) => sum + (log.delta || 0), 0) || 0;

    return new Response(
      JSON.stringify({
        date,
        goals_completed: completedGoals || [],
        azkar_progress: dailyAzkar || {
          fajr: 0,
          dhuhr: 0,
          asr: 0,
          maghrib: 0,
          isha: 0,
          total: 0,
          is_complete: false,
        },
        total_dhikr_count: totalDhikrCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error getting daily report:", error);
    throw error;
  }
}

// Синхронизация офлайн-событий
async function handleSyncOffline(body: SyncOfflineBody, supabase: SupabaseClient, userId: string) {
  try {
    const { events } = body;

    const results = [];
    for (const event of events) {
      try {
        // Проверяем, не синхронизировано ли уже (по offline_id)
        if (event.offline_id) {
          const { data: existing } = await supabase
            .from("dhikr_log")
            .select("id")
            .eq("offline_id", event.offline_id)
            .single();

          if (existing) {
            results.push({ offline_id: event.offline_id, status: "already_synced" });
            continue;
          }
        }

        // Обрабатываем событие в зависимости от типа
        if (event.type === "tap") {
          await handleCounterTap(event.data, supabase, userId);
        } else if (event.type === "learn_mark") {
          await handleMarkLearned(event.data, supabase, userId);
        }

        results.push({ offline_id: event.offline_id, status: "synced" });
      } catch (error) {
        results.push({ offline_id: event.offline_id, status: "error", error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error syncing offline:", error);
    throw error;
  }
}

