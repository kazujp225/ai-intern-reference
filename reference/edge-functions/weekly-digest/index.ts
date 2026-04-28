// Supabase Edge Function: weekly-digest
// 保存検索のユーザーに新着求人ダイジェストを Resend で送信
// pg_cron から毎週月曜 9:00 に呼ばれる想定
// Deploy: supabase functions deploy weekly-digest

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = Deno.env.get("MAIL_FROM") ?? "AIme <no-reply@aime.example>";

serve(async () => {
  // 通知ONの保存検索を一括取得
  const { data: searches } = await supabase.from("saved_searches")
    .select("id, user_id, label, params, last_checked_at")
    .eq("alert", true);

  if (!searches) return new Response("no saved searches", { status: 200 });
  const results: unknown[] = [];

  for (const s of searches) {
    // 新着求人を最後チェック以降で取得
    let q = supabase.from("job_postings")
      .select("id, title, company_id, created_at")
      .gte("created_at", s.last_checked_at)
      .eq("is_draft", false)
      .order("created_at", { ascending: false });

    if (s.params?.area)    q = q.ilike("location", `%${s.params.area}%`);
    if (s.params?.q)       q = q.ilike("title", `%${s.params.q}%`);
    if (s.params?.feature) q = q.contains("tags", [s.params.feature]);

    const { data: jobs } = await q.limit(10);
    if (!jobs || !jobs.length) continue;

    const { data: profile } = await supabase.from("auth.users").select("email").eq("id", s.user_id).single();
    if (!profile?.email) continue;

    const html = `
      <h2>${s.label} の新着求人</h2>
      <ul>${jobs.map(j => `<li><a href="https://aime.example/job.html?id=${j.id}">${j.title}</a></li>`).join("")}</ul>
      <p style="font-size:.85em;color:#888;">このメールは保存検索の通知設定によって送信されています。
        <a href="https://aime.example/saved-searches.html">通知設定</a></p>`;

    if (RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: profile.email, subject: `${s.label} の新着求人`, html }),
      });
    }

    await supabase.from("saved_searches")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("id", s.id);

    results.push({ search_id: s.id, jobs: jobs.length });
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
