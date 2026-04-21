// Supabase Edge Function: send-email
// Deploy: supabase functions deploy send-email
// 依存: Resend API key (Secret: RESEND_API_KEY)
//
// 用途: 応募通知・新着メッセージ・週次ダイジェストを Resend 経由で送信
// 呼び出し例:
//   POST /functions/v1/send-email
//   { "to": "user@example.com", "subject": "...", "html": "..." }

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_ADDR = Deno.env.get("MAIL_FROM") ?? "AIme <no-reply@aime.example>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { to, subject, html, text } = await req.json();
    if (!to || !subject || !(html || text)) {
      return new Response(JSON.stringify({ error: "to, subject, and html|text required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY is not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_ADDR, to: [to], subject, html, text }),
    });

    const json = await res.json();
    return new Response(JSON.stringify(json), {
      status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
