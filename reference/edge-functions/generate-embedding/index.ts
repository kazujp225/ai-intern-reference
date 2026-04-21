// Supabase Edge Function: generate-embedding
// OpenAI text-embedding-3-small でテキスト → 1536次元ベクトルに変換
// Deploy: supabase functions deploy generate-embedding
// Secrets: OPENAI_API_KEY
//
// 用途:
//  - プロフィール / 求人 / 会社説明の埋め込みを生成
//  - 生成したベクトルを profiles.embedding / job_postings.embedding に保存
//  - セマンティック検索の match_jobs RPC で使用

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { text, store } = await req.json();
    // store: { table: 'job_postings' | 'profiles' | 'companies', id: uuid }
    if (!text) return json({ error: "text is required" }, 400);
    if (!OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY not set" }, 500);

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });
    const data = await res.json();
    const embedding = data.data?.[0]?.embedding;
    if (!embedding) return json({ error: "no embedding returned", raw: data }, 500);

    if (store?.table && store?.id) {
      await supabase.from(store.table).update({ embedding }).eq("id", store.id);
    }
    return json({ embedding });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
