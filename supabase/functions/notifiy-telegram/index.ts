import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.202.0/http/server.ts";

serve(async (req) => {
  try {
    const payload = await req.json();
    const item = payload.record;

    if (!item || !item.id || !item.name) {
      console.error("Invalid payload received:", payload);
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
    const APP_URL = Deno.env.get("APP_URL") || "https://app.bringa.io";

    if (!BOT_TOKEN || !CHAT_ID) {
      console.error("Missing environment variables: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
    }

    const message =
      `${item.name} \n\n` +
      `${APP_URL}/items/details?id=${item.id}`;

    const tgResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
      }),
    });

    if (!tgResponse.ok) {
      const errorData = await tgResponse.json();
      console.error("Telegram API error:", errorData);
      return new Response(JSON.stringify({ error: "Telegram delivery failed" }), { status: 502 });
    }

    return new Response(JSON.stringify({ status: "ok" }), { 
      status: 200,
      headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.error("Internal service error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}) 
