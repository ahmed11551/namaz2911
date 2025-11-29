// Edge Function для API эндпоинтов модуля "Мой Духовный Путь"
// Обрабатывает: CRUD для целей, бейджей, streaks, групп, AI-отчетов

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

// Типы для данных
interface GoalUpdate {
  title?: string;
  description?: string;
  category?: string;
  knowledge_subcategory?: string;
  type?: string;
  period?: string;
  metric?: string;
  target_value?: number;
  current_value?: number;
  start_date?: string;
  end_date?: string;
  linked_counter_type?: string;
  status?: string;
  daily_plan?: number | null;
  group_id?: string;
  is_group_goal?: boolean;
  item_id?: string;
  item_type?: string;
  item_data?: Record<string, unknown>;
  is_learning?: boolean;
}

interface Badge {
  id: string;
  user_id: string;
  badge_type: string;
  level: string;
  goal_id?: string;
  achieved_at: string;
}

interface Goal {
  id: string;
  user_id: string;
  title: string;
  category: string;
  status: string;
  [key: string]: unknown;
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
    const path = url.pathname.replace("/spiritual-path-api", "");
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

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "user_id required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Роутинг для целей
    if (path === "/goals" && method === "GET") {
      return await handleGetGoals(req, supabase, userId);
    } else if (path === "/goals" && method === "POST") {
      return await handleCreateGoal(req, supabase, userId);
    } else if (path.startsWith("/goals/") && method === "PUT") {
      const goalId = path.replace("/goals/", "");
      return await handleUpdateGoal(req, supabase, userId, goalId);
    } else if (path.startsWith("/goals/") && method === "DELETE") {
      const goalId = path.replace("/goals/", "");
      return await handleDeleteGoal(req, supabase, userId, goalId);
    }
    // Роутинг для прогресса
    else if (path === "/counter/sync" && method === "POST") {
      return await handleCounterSync(req, supabase, userId);
    } else if (path.startsWith("/goals/") && path.endsWith("/progress") && method === "POST") {
      const goalId = path.replace("/goals/", "").replace("/progress", "");
      return await handleAddProgress(req, supabase, userId, goalId);
    }
    // Роутинг для бейджей
    else if (path === "/badges" && method === "GET") {
      return await handleGetBadges(req, supabase, userId);
    }
    // Роутинг для streaks
    else if (path === "/streaks" && method === "GET") {
      return await handleGetStreaks(req, supabase, userId);
    }
    // Роутинг для групп
    else if (path === "/groups" && method === "GET") {
      return await handleGetGroups(req, supabase, userId);
    } else if (path === "/groups" && method === "POST") {
      return await handleCreateGroup(req, supabase, userId);
    } else if (path.startsWith("/groups/") && path.endsWith("/join") && method === "POST") {
      const groupId = path.replace("/groups/", "").replace("/join", "");
      return await handleJoinGroup(req, supabase, userId, groupId);
    }
    // Роутинг для AI-отчетов
    else if (path === "/analytics/report" && method === "GET") {
      return await handleGetAIReport(req, supabase, userId);
    }
    // Роутинг для калькулятора каза
    else if (path === "/qaza/calculate" && method === "POST") {
      return await handleCalculateQaza(req, supabase, userId);
    }
    // Роутинг для уведомлений
    else if (path === "/notifications/settings" && method === "GET") {
      return await handleGetNotificationSettings(req, supabase, userId);
    } else if (path === "/notifications/settings" && method === "PUT") {
      return await handleUpdateNotificationSettings(req, supabase, userId);
    } else if (path === "/notifications" && method === "GET") {
      return await handleGetNotifications(req, supabase, userId);
    } else if (path === "/notifications/test" && method === "POST") {
      return await handleSendTestNotification(req, supabase, userId);
    } else if (path === "/notifications/send" && method === "POST") {
      return await handleSendNotification(req, supabase, userId);
    }
    // Роутинг для подписок/тарифов
    else if (path === "/subscription" && method === "GET") {
      return await handleGetSubscription(req, supabase, userId);
    } else if (path === "/subscription" && method === "PUT") {
      return await handleUpdateSubscription(req, supabase, userId);
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

// GET /goals - Получить список целей
async function handleGetGoals(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "active";

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// POST /goals - Создать цель
async function handleCreateGoal(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const body = await req.json();
  
  // Расчет рекомендуемого ежедневного плана
  let dailyPlan: number | null = null;
  if (body.start_date && body.end_date && body.target_value) {
    const start = new Date(body.start_date);
    const end = new Date(body.end_date);
    const daysRemaining = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining > 0) {
      dailyPlan = (body.target_value - (body.current_value || 0)) / daysRemaining;
    }
  }

  const goalData = {
    user_id: userId,
    title: body.title,
    description: body.description,
    category: body.category,
    knowledge_subcategory: body.knowledge_subcategory,
    type: body.type,
    period: body.period,
    metric: body.metric,
    target_value: body.target_value,
    current_value: body.current_value || 0,
    start_date: body.start_date,
    end_date: body.end_date,
    linked_counter_type: body.linked_counter_type,
    status: body.status || "active",
    daily_plan: dailyPlan,
    group_id: body.group_id,
    is_group_goal: body.is_group_goal || false,
  };

  const { data, error } = await supabase
    .from("goals")
    .insert(goalData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// PUT /goals/{id} - Обновить цель
async function handleUpdateGoal(
  req: Request,
  supabase: SupabaseClient,
  userId: string,
  goalId: string
) {
  const body = await req.json();

  // Проверяем, что цель принадлежит пользователю
  const { data: existingGoal, error: checkError } = await supabase
    .from("goals")
    .select("user_id")
    .eq("id", goalId)
    .single();

  if (checkError || !existingGoal || existingGoal.user_id !== userId) {
    return new Response(
      JSON.stringify({ error: "Goal not found or access denied" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Пересчитываем daily_plan при изменении дат или целевого значения
  let dailyPlan = body.daily_plan;
  if ((body.start_date || body.end_date || body.target_value) && !dailyPlan) {
    const start = new Date(body.start_date || existingGoal.start_date);
    const end = new Date(body.end_date || existingGoal.end_date);
    const daysRemaining = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining > 0) {
      dailyPlan = (body.target_value || existingGoal.target_value - existingGoal.current_value) / daysRemaining;
    }
  }

  const updateData: GoalUpdate = { ...body };
  if (dailyPlan !== undefined) {
    updateData.daily_plan = dailyPlan;
  }

  const { data, error } = await supabase
    .from("goals")
    .update(updateData)
    .eq("id", goalId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Если цель завершена, проверяем бейджи
  let newBadges: Badge[] = [];
  if (data.status === "completed") {
    const today = new Date().toISOString().split("T")[0];
    await updateStreaks(supabase, userId, data, today);
    newBadges = await checkAndAwardBadges(supabase, userId, data);
  }

  return new Response(
    JSON.stringify({
      ...data,
      new_badges: newBadges,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// DELETE /goals/{id} - Удалить цель
async function handleDeleteGoal(
  req: Request,
  supabase: SupabaseClient,
  userId: string,
  goalId: string
) {
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// POST /counter/sync - Синхронизация данных тасбиха с целями
async function handleCounterSync(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const body = await req.json();
  const { counter_type, value, date } = body;

  // Находим все активные цели, связанные с этим типом счетчика
  const { data: goals, error: goalsError } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .eq("linked_counter_type", counter_type);

  if (goalsError) {
    throw goalsError;
  }

  const progressUpdates = [];
  const today = date || new Date().toISOString().split("T")[0];
  const newBadges: Badge[] = [];

  for (const goal of goals || []) {
    // Добавляем прогресс для цели
    const { data: existingProgress, error: progressCheckError } = await supabase
      .from("goal_progress")
      .select("*")
      .eq("goal_id", goal.id)
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (progressCheckError && progressCheckError.code !== "PGRST116") {
      // PGRST116 = not found, это нормально
      console.error("Error checking progress:", progressCheckError);
      continue;
    }

    const newValue = (existingProgress?.value || 0) + value;

    if (existingProgress) {
      // Обновляем существующий прогресс
      const { error: updateError } = await supabase
        .from("goal_progress")
        .update({ value: newValue })
        .eq("id", existingProgress.id);

      if (updateError) {
        console.error("Error updating progress:", updateError);
      } else {
        progressUpdates.push({ goal_id: goal.id, value: newValue });
      }
    } else {
      // Создаем новый прогресс
      const { error: insertError } = await supabase
        .from("goal_progress")
        .insert({
          goal_id: goal.id,
          user_id: userId,
          date: today,
          value: value,
        });

      if (insertError) {
        console.error("Error inserting progress:", insertError);
      } else {
        progressUpdates.push({ goal_id: goal.id, value: value });
      }
    }

    // Обновляем current_value цели
    const newCurrentValue = (goal.current_value || 0) + value;
    await supabase
      .from("goals")
      .update({ current_value: newCurrentValue })
      .eq("id", goal.id);

    // Обновляем streaks и проверяем бейджи
    await updateStreaks(supabase, userId, goal, today);
    const badges = await checkAndAwardBadges(supabase, userId, goal);
    newBadges.push(...badges);
  }

  return new Response(
    JSON.stringify({
      success: true,
      updated_goals: progressUpdates,
      new_badges: newBadges,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// POST /goals/{id}/progress - Добавить прогресс вручную
async function handleAddProgress(
  req: Request,
  supabase: SupabaseClient,
  userId: string,
  goalId: string
) {
  const body = await req.json();
  const { value, date, notes } = body;

  const progressDate = date || new Date().toISOString().split("T")[0];

  // Проверяем, что цель принадлежит пользователю
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .single();

  if (goalError || !goal || goal.user_id !== userId) {
    return new Response(
      JSON.stringify({ error: "Goal not found or access denied" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Проверяем существующий прогресс
  const { data: existingProgress, error: checkError } = await supabase
    .from("goal_progress")
    .select("*")
    .eq("goal_id", goalId)
    .eq("user_id", userId)
    .eq("date", progressDate)
    .single();

  let result;
  if (existingProgress) {
    // Обновляем
    const { data, error } = await supabase
      .from("goal_progress")
      .update({
        value: (existingProgress.value || 0) + value,
        notes: notes || existingProgress.notes,
      })
      .eq("id", existingProgress.id)
      .select()
      .single();

    if (error) throw error;
    result = data;
  } else {
    // Создаем новый
    const { data, error } = await supabase
      .from("goal_progress")
      .insert({
        goal_id: goalId,
        user_id: userId,
        date: progressDate,
        value: value,
        notes: notes,
      })
      .select()
      .single();

    if (error) throw error;
    result = data;
  }

  // Обновляем current_value цели
  const newCurrentValue = (goal.current_value || 0) + value;
  await supabase
    .from("goals")
    .update({ current_value: newCurrentValue })
    .eq("id", goalId);

  // Обновляем streaks и проверяем бейджи
  await updateStreaks(supabase, userId, goal, progressDate);
  const newBadges = await checkAndAwardBadges(supabase, userId, goal);

  return new Response(
    JSON.stringify({
      ...result,
      new_badges: newBadges,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// GET /badges - Получить бейджи пользователя
async function handleGetBadges(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .eq("user_id", userId)
    .order("achieved_at", { ascending: false });

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// GET /streaks - Получить streaks пользователя
async function handleGetStreaks(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .order("current_streak", { ascending: false });

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// GET /groups - Получить группы пользователя
async function handleGetGroups(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("goal_group_members")
    .select(`
      *,
      goal_groups (
        *,
        goals (*)
      )
    `)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// POST /groups - Создать группу
async function handleCreateGroup(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const body = await req.json();
  const { name, goal_id } = body;

  // Генерируем уникальный код приглашения
  const inviteCode = `GRP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const { data, error } = await supabase
    .from("goal_groups")
    .insert({
      name,
      goal_id,
      created_by: userId,
      invite_code: inviteCode,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Добавляем создателя в участники
  await supabase.from("goal_group_members").insert({
    group_id: data.id,
    user_id: userId,
    progress_contribution: 0,
  });

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// POST /groups/{id}/join - Присоединиться к группе
async function handleJoinGroup(
  req: Request,
  supabase: SupabaseClient,
  userId: string,
  groupId: string
) {
  const body = await req.json();
  const inviteCode = body.invite_code || groupId;

  // Находим группу по invite_code или id
  const { data: group, error: groupError } = await supabase
    .from("goal_groups")
    .select("*")
    .or(`id.eq.${groupId},invite_code.eq.${inviteCode}`)
    .single();

  if (groupError || !group) {
    return new Response(
      JSON.stringify({ error: "Group not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Проверяем, не является ли пользователь уже участником
  const { data: existingMember } = await supabase
    .from("goal_group_members")
    .select("*")
    .eq("group_id", group.id)
    .eq("user_id", userId)
    .single();

  if (existingMember) {
    return new Response(
      JSON.stringify({ error: "Already a member" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Добавляем пользователя в группу
  const { data, error } = await supabase
    .from("goal_group_members")
    .insert({
      group_id: group.id,
      user_id: userId,
      progress_contribution: 0,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return new Response(JSON.stringify({ success: true, group, member: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// GET /analytics/report - Получить AI-отчет
async function handleGetAIReport(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const url = new URL(req.url);
  const reportType = url.searchParams.get("type") || "weekly";

  // Здесь должна быть логика генерации AI-отчета
  // Пока возвращаем базовый отчет
  const insights = [
    {
      type: "achievement",
      title: "Отличный прогресс!",
      description: "Вы выполнили 80% ваших целей на этой неделе",
    },
  ];

  const report = {
    id: `report_${Date.now()}`,
    user_id: userId,
    report_type: reportType,
    period_start: new Date(),
    period_end: new Date(),
    insights,
    generated_at: new Date(),
  };

  return new Response(JSON.stringify(report), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// POST /qaza/calculate - Рассчитать каза
async function handleCalculateQaza(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const body = await req.json();
  const { mode, manual_count, gender, birth_date, prayer_start_date, travel_periods } = body;

  // Здесь должна быть логика расчета каза
  // Пока возвращаем базовую структуру
  const result = {
    mode,
    total_debt: manual_count || 0,
    debt_map: {},
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Вспомогательная функция: Обновление streaks
async function updateStreaks(
  supabase: SupabaseClient,
  userId: string,
  goal: Goal,
  progressDate: string
) {
  const today = new Date(progressDate);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Проверяем, выполнена ли цель за сегодня
  const { data: todayProgress } = await supabase
    .from("goal_progress")
    .select("value")
    .eq("goal_id", goal.id)
    .eq("user_id", userId)
    .eq("date", progressDate)
    .single();

  const isGoalCompletedToday = todayProgress && todayProgress.value >= goal.target_value;

  // Обновляем категорийный streak
  if (isGoalCompletedToday && goal.category) {
    const { data: categoryStreak } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", userId)
      .eq("streak_type", "category")
      .eq("category", goal.category)
      .single();

    if (categoryStreak) {
      const lastActivity = new Date(categoryStreak.last_activity_date);
      const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      let newStreak = categoryStreak.current_streak;
      if (daysDiff === 0) {
        // Уже обновлено сегодня
      } else if (daysDiff === 1) {
        // Продолжаем серию
        newStreak = categoryStreak.current_streak + 1;
      } else {
        // Сбрасываем серию
        newStreak = 1;
      }

      await supabase
        .from("streaks")
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(categoryStreak.longest_streak, newStreak),
          last_activity_date: progressDate,
        })
        .eq("id", categoryStreak.id);
    } else {
      // Создаем новый категорийный streak
      await supabase.from("streaks").insert({
        user_id: userId,
        streak_type: "category",
        category: goal.category,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: progressDate,
      });
    }
  }

  // Обновляем daily streak (проверяем все активные цели)
  const { data: allActiveGoals } = await supabase
    .from("goals")
    .select("id, target_value")
    .eq("user_id", userId)
    .eq("status", "active");

  if (allActiveGoals && allActiveGoals.length > 0) {
    // Проверяем, выполнены ли все цели за сегодня
    let allGoalsCompleted = true;
    for (const activeGoal of allActiveGoals) {
      const { data: goalProgress } = await supabase
        .from("goal_progress")
        .select("value")
        .eq("goal_id", activeGoal.id)
        .eq("user_id", userId)
        .eq("date", progressDate)
        .single();

      if (!goalProgress || goalProgress.value < activeGoal.target_value) {
        allGoalsCompleted = false;
        break;
      }
    }

    if (allGoalsCompleted) {
      const { data: dailyStreak } = await supabase
        .from("streaks")
        .select("*")
        .eq("user_id", userId)
        .eq("streak_type", "daily_all")
        .single();

      if (dailyStreak) {
        const lastActivity = new Date(dailyStreak.last_activity_date);
        const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

        let newStreak = dailyStreak.current_streak;
        if (daysDiff === 0) {
          // Уже обновлено сегодня
        } else if (daysDiff === 1) {
          // Продолжаем серию
          newStreak = dailyStreak.current_streak + 1;
        } else {
          // Сбрасываем серию
          newStreak = 1;
        }

        await supabase
          .from("streaks")
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(dailyStreak.longest_streak, newStreak),
            last_activity_date: progressDate,
          })
          .eq("id", dailyStreak.id);
      } else {
        // Создаем новый daily streak
        await supabase.from("streaks").insert({
          user_id: userId,
          streak_type: "daily_all",
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: progressDate,
        });
      }
    }
  }
}

// Вспомогательная функция: Проверка и выдача бейджей
async function checkAndAwardBadges(
  supabase: SupabaseClient,
  userId: string,
  goal: Goal
): Promise<Badge[]> {
  const newBadges: Badge[] = [];

  // 1. Проверка prayer_consistency (для целей категории prayer)
  if (goal.category === "prayer") {
    const { data: prayerStreak } = await supabase
      .from("streaks")
      .select("current_streak")
      .eq("user_id", userId)
      .eq("streak_type", "category")
      .eq("category", "prayer")
      .single();

    if (prayerStreak) {
      const streakDays = prayerStreak.current_streak;
      const levels = [
        { days: 30, level: "copper" },
        { days: 90, level: "silver" },
        { days: 180, level: "gold" },
      ];

      for (const { days, level } of levels) {
        if (streakDays >= days) {
          // Проверяем, есть ли уже такой бейдж
          const { data: existingBadge } = await supabase
            .from("badges")
            .select("*")
            .eq("user_id", userId)
            .eq("badge_type", "prayer_consistency")
            .eq("level", level)
            .single();

          if (!existingBadge) {
            // Выдаем бейдж
            const { data: badge } = await supabase
              .from("badges")
              .insert({
                user_id: userId,
                badge_type: "prayer_consistency",
                level: level,
                goal_id: goal.id,
              })
              .select()
              .single();

            if (badge) newBadges.push(badge);
          }
        }
      }
    }
  }

  // 2. Проверка quran_completion (для целей категории quran)
  if (goal.category === "quran") {
    // Проверяем, достигнута ли цель (604 страницы = весь Коран)
    if (goal.current_value >= 604) {
      const { data: existingBadge } = await supabase
        .from("badges")
        .select("*")
        .eq("user_id", userId)
        .eq("badge_type", "quran_completion")
        .single();

      if (!existingBadge) {
        const { data: badge } = await supabase
          .from("badges")
          .insert({
            user_id: userId,
            badge_type: "quran_completion",
            level: "gold", // Коран - всегда золотой
            goal_id: goal.id,
          })
          .select()
          .single();

        if (badge) newBadges.push(badge);
      }
    }
  }

  // 3. Проверка zikr_consistency (1000+ зикров за месяц)
  if (goal.category === "zikr") {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const monthAgoStr = monthAgo.toISOString().split("T")[0];

    const { data: monthlyProgress } = await supabase
      .from("goal_progress")
      .select("value")
      .eq("goal_id", goal.id)
      .eq("user_id", userId)
      .gte("date", monthAgoStr);

    if (monthlyProgress) {
      const totalZikr = monthlyProgress.reduce((sum, p) => sum + (p.value || 0), 0);
      if (totalZikr >= 1000) {
        const { data: existingBadge } = await supabase
          .from("badges")
          .select("*")
          .eq("user_id", userId)
          .eq("badge_type", "zikr_consistency")
          .eq("level", "gold")
          .single();

        if (!existingBadge) {
          const { data: badge } = await supabase
            .from("badges")
            .insert({
              user_id: userId,
              badge_type: "zikr_consistency",
              level: "gold",
              goal_id: goal.id,
            })
            .select()
            .single();

          if (badge) newBadges.push(badge);
        }
      }
    }
  }

  // 4. Проверка streak_master (серия 100+ дней)
  const { data: dailyStreak } = await supabase
    .from("streaks")
    .select("current_streak")
    .eq("user_id", userId)
    .eq("streak_type", "daily_all")
    .single();

  if (dailyStreak && dailyStreak.current_streak >= 100) {
    const { data: existingBadge } = await supabase
      .from("badges")
      .select("*")
      .eq("user_id", userId)
      .eq("badge_type", "streak_master")
      .eq("level", "gold")
      .single();

    if (!existingBadge) {
      const { data: badge } = await supabase
        .from("badges")
        .insert({
          user_id: userId,
          badge_type: "streak_master",
          level: "gold",
        })
        .select()
        .single();

      if (badge) newBadges.push(badge);
    }
  }

  // 5. Проверка goal_achiever (выполнение 10+ целей)
  const { count: completedCount } = await supabase
    .from("goals")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  if (completedCount && completedCount >= 10) {
    const { data: existingBadge } = await supabase
      .from("badges")
      .select("*")
      .eq("user_id", userId)
      .eq("badge_type", "goal_achiever")
      .eq("level", "gold")
      .single();

    if (!existingBadge) {
      const { data: badge } = await supabase
        .from("badges")
        .insert({
          user_id: userId,
          badge_type: "goal_achiever",
          level: "gold",
        })
        .select()
        .single();

      if (badge) newBadges.push(badge);
    }
  }

  return newBadges;
}

// GET /notifications/settings - Получить настройки уведомлений
async function handleGetNotificationSettings(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found, это нормально для первого входа
    throw error;
  }

  const defaultSettings = {
    user_id: userId,
    enabled: true,
    telegram_enabled: true,
    notification_period_start: "08:00",
    notification_period_end: "22:00",
    daily_reminder_enabled: true,
    motivation_enabled: true,
    badge_notifications_enabled: true,
    updated_at: new Date().toISOString(),
  };

  return new Response(
    JSON.stringify(data || defaultSettings),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// PUT /notifications/settings - Обновить настройки уведомлений
async function handleUpdateNotificationSettings(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const body = await req.json();
  
  const settingsData = {
    user_id: userId,
    enabled: body.enabled ?? true,
    telegram_enabled: body.telegram_enabled ?? true,
    notification_period_start: body.notification_period_start || "08:00",
    notification_period_end: body.notification_period_end || "22:00",
    daily_reminder_enabled: body.daily_reminder_enabled ?? true,
    motivation_enabled: body.motivation_enabled ?? true,
    badge_notifications_enabled: body.badge_notifications_enabled ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("notification_settings")
    .upsert(settingsData, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// GET /notifications - Получить список уведомлений
async function handleGetNotifications(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  // Пока возвращаем пустой массив, так как таблица smart_notifications может не существовать
  // В будущем можно добавить таблицу для хранения истории уведомлений
  return new Response(
    JSON.stringify([]),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// POST /notifications/test - Отправить тестовое уведомление
async function handleSendTestNotification(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  // Получаем имя пользователя из Telegram или используем "Пользователь"
  const userName = await getUserName(supabase, userId);
  
  const testMessage = `${userName} – это тестовое уведомление. Уведомления работают корректно! ✅`;

  // Отправляем через Telegram Bot API, если настроено
  const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const { data: settings } = await supabase
    .from("notification_settings")
    .select("telegram_enabled, telegram_chat_id")
    .eq("user_id", userId)
    .single();

  if (telegramBotToken && settings?.telegram_enabled && settings?.telegram_chat_id) {
    try {
      await sendTelegramMessage(telegramBotToken, settings.telegram_chat_id, testMessage);
    } catch (error) {
      console.error("Error sending Telegram notification:", error);
    }
  }

  return new Response(
    JSON.stringify({ success: true, message: "Test notification sent" }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// POST /notifications/send - Отправить персонализированное уведомление
async function handleSendNotification(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const body = await req.json();
  const { goal_id, type } = body;

  if (!goal_id || !type) {
    return new Response(
      JSON.stringify({ error: "goal_id and type are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Получаем цель
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("*")
    .eq("id", goal_id)
    .eq("user_id", userId)
    .single();

  if (goalError || !goal) {
    return new Response(
      JSON.stringify({ error: "Goal not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Получаем имя пользователя
  const userName = await getUserName(supabase, userId);

  // Генерируем персонализированное сообщение
  const personalizedMessage = generatePersonalizedMessage(
    userName,
    goal,
    type as "reminder" | "motivation" | "congratulations" | "warning"
  );

  // Отправляем через Telegram Bot API, если настроено
  const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const { data: settings } = await supabase
    .from("notification_settings")
    .select("telegram_enabled, telegram_chat_id")
    .eq("user_id", userId)
    .single();

  if (telegramBotToken && settings?.telegram_enabled && settings?.telegram_chat_id) {
    try {
      await sendTelegramMessage(telegramBotToken, settings.telegram_chat_id, personalizedMessage);
    } catch (error) {
      console.error("Error sending Telegram notification:", error);
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: personalizedMessage,
      personalized_message: personalizedMessage 
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// Вспомогательная функция для получения имени пользователя
async function getUserName(supabase: SupabaseClient, userId: string): Promise<string> {
  // Пытаемся получить имя из базы данных (если есть таблица users)
  // Или из Telegram Bot API по user_id
  
  // Парсим userId - если это Telegram ID (формат tg_123456789)
  if (userId.startsWith("tg_")) {
    const telegramId = userId.replace("tg_", "");
    
    // Пытаемся получить имя через Telegram Bot API
    const telegramBotToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (telegramBotToken) {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${telegramBotToken}/getChat?chat_id=${telegramId}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.ok && data.result) {
            const firstName = data.result.first_name || "";
            const lastName = data.result.last_name || "";
            if (firstName) {
              return lastName ? `${firstName} ${lastName}` : firstName;
            }
          }
        }
      } catch (error) {
        console.warn("Error fetching user name from Telegram:", error);
      }
    }
  }
  
  // Fallback: используем "Пользователь" или первую часть userId
  return "Пользователь";
}

// Вспомогательная функция для генерации персонализированного сообщения
function generatePersonalizedMessage(
  userName: string,
  goal: Goal,
  type: "reminder" | "motivation" | "congratulations" | "warning"
): string {
  const remaining = Math.max(0, goal.target_value - (goal.current_value || 0));
  const progressPercent = goal.target_value > 0 
    ? Math.round(((goal.current_value || 0) / goal.target_value) * 100)
    : 0;

  // Расчет дней до дедлайна
  let daysRemaining: number | null = null;
  let isOverdue = false;
  
  if (goal.end_date) {
    const endDate = new Date(goal.end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      isOverdue = true;
      daysRemaining = Math.abs(diffDays);
    } else {
      daysRemaining = diffDays;
    }
  }

  // Расчет ежедневного плана
  let dailyPlan = 0;
  if (daysRemaining !== null && daysRemaining > 0 && remaining > 0) {
    dailyPlan = Math.ceil(remaining / daysRemaining);
  }

  switch (type) {
    case "reminder": {
      // Напоминание о дневном плане
      if (goal.daily_plan) {
        const dailyRemaining = Math.max(0, Math.ceil(goal.daily_plan) - (goal.current_value || 0));
        return `${userName} – у тебя цель "${goal.title}", осталось ${dailyRemaining} ${getUnitForCategory(goal.category)} для выполнения дневного плана`;
      }
      return `${userName} – не забудь выполнить цель "${goal.title}" (${goal.current_value || 0}/${goal.target_value})`;
    }

    case "motivation": {
      // Мотивация при отставании
      if (isOverdue) {
        return `${userName} – вы отстаете от графика. Цель "${goal.title}" просрочена на ${daysRemaining} ${pluralizeDays(daysRemaining!)}. Нужно делать ${dailyPlan > 0 ? dailyPlan : Math.ceil(remaining / 30)} ${getUnitForCategory(goal.category)} в день, чтобы догнать план`;
      } else if (daysRemaining !== null && daysRemaining > 0) {
        return `${userName} – вы отстаете от графика. Чтобы достичь цель "${goal.title}", осталось ${daysRemaining} ${pluralizeDays(daysRemaining)}. Нужно делать ${dailyPlan} ${getUnitForCategory(goal.category)} в день`;
      }
      return `${userName} – продолжайте в том же духе! Цель "${goal.title}" выполнена на ${progressPercent}%`;
    }

    case "congratulations": {
      return `${userName} – поздравляем! Вы достигли цели "${goal.title}" 🎉`;
    }

    case "warning": {
      if (isOverdue) {
        return `${userName} – цель "${goal.title}" просрочена на ${daysRemaining} ${pluralizeDays(daysRemaining!)}. Пора активизироваться!`;
      }
      return `${userName} – цель "${goal.title}" требует внимания. Осталось ${remaining} ${getUnitForCategory(goal.category)}`;
    }

    default:
      return `${userName} – у вас есть активная цель "${goal.title}"`;
  }
}

// Вспомогательная функция для получения единицы измерения по категории
function getUnitForCategory(category: string): string {
  switch (category) {
    case "prayer":
      return "намазов";
    case "quran":
      return "страниц";
    case "zikr":
      return "зикров";
    case "sadaqa":
      return "раз";
    case "knowledge":
      return "уроков";
    case "names_of_allah":
      return "имен";
    default:
      return "раз";
  }
}

// Вспомогательная функция для склонения дней
function pluralizeDays(days: number): string {
  const lastDigit = days % 10;
  const lastTwoDigits = days % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return "дней";
  }
  
  if (lastDigit === 1) {
    return "день";
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    return "дня";
  } else {
    return "дней";
  }
}

// Вспомогательная функция для отправки сообщения в Telegram
async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string
): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Telegram API error: ${error.description || "Unknown error"}`);
  }
}

// GET /subscription - Получить тариф пользователя
async function handleGetSubscription(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = not found, это нормально для первого входа
    throw error;
  }

  // Если подписки нет, возвращаем бесплатный тариф
  const defaultSubscription = {
    user_id: userId,
    tier: "muslim" as const,
    subscription_start: new Date().toISOString(),
    subscription_end: null,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Проверяем, не истекла ли подписка
  if (data && data.subscription_end) {
    const endDate = new Date(data.subscription_end);
    const now = new Date();
    if (endDate < now) {
      // Подписка истекла, возвращаем бесплатный тариф
      return new Response(
        JSON.stringify(defaultSubscription),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  return new Response(
    JSON.stringify(data || defaultSubscription),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// PUT /subscription - Обновить тариф пользователя
async function handleUpdateSubscription(
  req: Request,
  supabase: SupabaseClient,
  userId: string
) {
  const body = await req.json();
  const { tier, subscription_end } = body;

  if (!tier || !["muslim", "mutahsin", "sahib_al_waqf"].includes(tier)) {
    return new Response(
      JSON.stringify({ error: "Invalid tier. Must be 'muslim', 'mutahsin', or 'sahib_al_waqf'" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const subscriptionData = {
    user_id: userId,
    tier: tier,
    subscription_start: new Date().toISOString(),
    subscription_end: subscription_end || null,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_subscriptions")
    .upsert(subscriptionData, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify(data),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}


