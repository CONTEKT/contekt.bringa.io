import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const profile = payload.record;

    if (!profile || !profile.id) {
      console.error("Invalid payload received:", payload);
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN_USER");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID_USER");

    if (!botToken || !chatId) {
      console.error("Missing environment variables: TELEGRAM_BOT_TOKEN_USER or TELEGRAM_CHAT_ID_USER");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
    }

    const displayName = [profile.display_name, profile.display_surname].filter(Boolean).join(" ").trim();
    const message = displayName
      ? `New profile activity: ${displayName}`
      : "New profile activity";

    const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
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
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Internal service error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
})
