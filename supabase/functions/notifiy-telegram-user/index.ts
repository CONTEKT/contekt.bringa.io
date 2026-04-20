// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  const payload = await req.json();
  
  const user = payload.record;

  const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN_USER");
  const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID_USER");

  const message = 
      `${user.display_name} ${user.display_surname}\n` + 
      `${user.email}`;

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
    }),
  });

  return new Response("ok");
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/notifiy-telegram-user' \
    --header 'Authorization: Bearer eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjIwODM2ODgyNTN9.OInBgDN3bb8Z-Y8TIMX4ZFj8ZQa1hb-cbz2fmKkgLnHbxuAS-IAbscdwfrL-S1RtLBe-NVt9bRLGQdPxZ5B9Ng' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
