// Edge Function-прокси для безопасного доступа к bot.e-replika.ru/api
// Обходит проблему с просроченным SSL-сертификатом и добавляет авторизацию на сервере

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
};

const DEFAULT_API_BASE = "https://bot.e-replika.ru/api";
const DEFAULT_TOKEN = "test_token_123";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/ereplika-proxy", "") || "/";
    const query = url.search;

    const targetBase = Deno.env.get("EREPLIKA_API_BASE") ?? DEFAULT_API_BASE;
    const targetToken =
      Deno.env.get("EREPLIKA_API_TOKEN") ?? DEFAULT_TOKEN;

    const targetUrl = `${targetBase}${path}${query}`;

    const forwardHeaders = new Headers(req.headers);
    forwardHeaders.set("Authorization", `Bearer ${targetToken}`);

    // Если клиент не передал Content-Type, оставляем как есть
    if (
      !forwardHeaders.has("Content-Type") &&
      req.method !== "GET" &&
      req.method !== "HEAD"
    ) {
      forwardHeaders.set("Content-Type", "application/json");
    }

    // Удаляем заголовки, которые не нужны целевому API
    forwardHeaders.delete("Host");
    forwardHeaders.delete("Content-Length");

    let body: BodyInit | null = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.arrayBuffer();
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: body ? body : undefined,
    });

    const responseHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("eReplika proxy error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to reach e-Replika API",
        details: error.message ?? String(error),
      }),
      {
        status: 502,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

