# AIme Edge Functions

Supabase Edge Functions (Deno) のソースコード。

## ディレクトリ構成

| Function | 用途 | 依存 Secret |
|---|---|---|
| `send-email/` | Resend 経由でメール送信 (汎用) | `RESEND_API_KEY`, `MAIL_FROM` |
| `stripe-checkout/` | 企業プラン購入の Stripe Checkout セッション作成 | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ENT` |
| `stripe-webhook/` | Stripe 決済完了Webhook → `companies.plan` 更新 | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` |
| `generate-embedding/` | OpenAI で text → ベクトル埋め込み生成 | `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| `weekly-digest/` | 保存検索の新着求人を週次でメール配信 | `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

## デプロイ手順

```bash
# Supabase CLI 初期化 (未実行なら)
supabase login
supabase link --project-ref <your-project-ref>

# Secrets をまとめて設定
supabase secrets set \
  RESEND_API_KEY=re_xxx \
  MAIL_FROM='AIme <no-reply@your-domain.com>' \
  OPENAI_API_KEY=sk-xxx \
  STRIPE_SECRET_KEY=sk_test_xxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxx \
  STRIPE_PRICE_PRO=price_xxx \
  STRIPE_PRICE_ENT=price_xxx

# デプロイ
supabase functions deploy send-email
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy generate-embedding
supabase functions deploy weekly-digest
```

## 呼び出し方 (クライアント → Edge Function)

```js
const { data: { session } } = await sb.auth.getSession();
const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ to, subject, html }),
});
```

## pg_cron からの呼び出し (weekly-digest)

`schema-v3.sql` に追加例:

```sql
select cron.schedule(
  'weekly-digest',
  '0 9 * * 1',
  $$ select net.http_post(
       url := 'https://<project>.supabase.co/functions/v1/weekly-digest',
       headers := '{"Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb
     ); $$
);
```
※ `net.http_post` は拡張 `pg_net` が必要です。
