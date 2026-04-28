# AIme v3 セットアップガイド

全機能 (follows / saved searches / reviews / events / reports / settings / pricing / analytics / semantic search / edge functions) を有効化するための手順書。

---

## 1. Supabase プロジェクト

### 1-1. SQL マイグレーション実行

Supabase Dashboard → SQL Editor で **順番に** 実行：

1. `sql/schema.sql` — 基本スキーマ (v1)
2. `sql/schema-v2.sql` — 企業・求人・メッセージ (v2)
3. `sql/schema-v3.sql` — v3 全機能 ✨

### 1-2. Storage バケット作成

`schema-v3.sql` に含まれる `insert into storage.buckets ...` で自動作成されます。確認：

- `logos` (Public) — 企業ロゴ
- `covers` (Public) — カバー画像
- `avatars` (Public) — ユーザーアバター
- `resumes` (Private) — 履歴書
- `portfolios` (Private) — ポートフォリオ

### 1-3. 拡張機能

`schema-v3.sql` で自動インストールされますが、Supabase Dashboard → Database → Extensions で有効化されているか確認：

- `pg_trgm` (あいまい検索)
- `unaccent`
- `vector` (pgvector)
- `pg_cron` (スケジュール実行)
- `pg_net` (HTTP呼び出し — 任意)

---

## 2. 認証プロバイダ設定

Supabase Dashboard → Authentication → Providers で以下を有効化：

### Google OAuth
1. [Google Cloud Console](https://console.cloud.google.com/) で OAuth Client ID 作成
2. Redirect URI: `https://<project>.supabase.co/auth/v1/callback`
3. Supabase 側に Client ID / Secret を入力

### LinkedIn OAuth (OIDC)
1. [LinkedIn Developers](https://www.linkedin.com/developers/) でアプリ作成
2. Sign In with LinkedIn using OpenID Connect を有効化
3. Redirect URI: `https://<project>.supabase.co/auth/v1/callback`
4. Supabase 側で "LinkedIn (OIDC)" を有効化

### GitHub OAuth
1. GitHub Settings → Developer settings → OAuth Apps で新規作成
2. Callback URL: `https://<project>.supabase.co/auth/v1/callback`
3. Supabase 側に Client ID / Secret を入力

### Email 確認の無効化 (開発中)
Authentication → Providers → Email → "Confirm email" を OFF にすると、登録直後にログイン可能。

---

## 3. Edge Functions デプロイ

```bash
# 初期セットアップ
supabase login
supabase link --project-ref <your-project-ref>

# Secrets 設定
supabase secrets set \
  RESEND_API_KEY=re_xxx \
  MAIL_FROM='AIme <no-reply@your-domain.com>' \
  OPENAI_API_KEY=sk-xxx \
  STRIPE_SECRET_KEY=sk_test_xxx \
  STRIPE_WEBHOOK_SECRET=whsec_xxx \
  STRIPE_PRICE_PRO=price_xxx \
  STRIPE_PRICE_ENT=price_xxx

# デプロイ
cd edge-functions
supabase functions deploy send-email
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy generate-embedding
supabase functions deploy weekly-digest
```

---

## 4. Stripe セットアップ

1. [Stripe Dashboard](https://dashboard.stripe.com/) でアカウント作成
2. Products → "AIme Pro" を月額 ¥29,800 で作成 → Price ID を `STRIPE_PRICE_PRO` に
3. Webhook endpoint 追加:
   - URL: `https://<project>.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`
   - Signing secret を `STRIPE_WEBHOOK_SECRET` に

---

## 5. OpenAI Embedding (pgvector) セットアップ

セマンティック検索と求人レコメンドを有効化するには、既存/新規求人に埋め込みを生成して保存する必要があります。

### 一括埋め込み生成 (初回)

```sql
-- job_postings の埋め込み未生成レコードを洗い出し
select id, title from public.job_postings where embedding is null;
```

それぞれに対して Edge Function を呼び出して埋め込みを生成：

```bash
curl -X POST "https://<project>.supabase.co/functions/v1/generate-embedding" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"text":"LLM開発インターン ...", "store":{"table":"job_postings","id":"<uuid>"}}'
```

### 新規投稿時の自動生成 (推奨)

`company-job-edit.html` に、求人作成時に `generate-embedding` を呼び出す処理を追加すると、セマンティック検索が自動で動作します。

---

## 6. pg_cron で週次ダイジェスト配信

```sql
-- pg_net を有効化
create extension if not exists pg_net;

-- 毎週月曜9時に weekly-digest Edge Function を呼ぶ
select cron.schedule(
  'weekly-digest',
  '0 9 * * 1',
  $$
  select net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/weekly-digest',
    headers := format('{"Authorization":"Bearer %s"}', current_setting('app.service_role_key'))::jsonb
  );
  $$
);
```

※ `app.service_role_key` は Database → Settings → Config で設定できます。

---

## 7. 管理者ロール付与

特定のユーザーを admin にする (reports-admin.html / admin.html にアクセス可):

```sql
update public.profiles set role = 'admin' where id = '<your-user-uuid>';
```

---

## 8. 動作確認チェックリスト

| 機能 | 確認方法 |
|---|---|
| OAuth ログイン | `login.html` → Google/LinkedIn/GitHub ボタン |
| Magic Link | `login.html` の下部メールフォーム |
| フォロー | `company.html` の「フォローする」ボタン |
| レビュー投稿 | `company.html` 下部のフォーム |
| 保存検索 | `search.html` 右上「＋ この検索を保存」 |
| イベント一覧 | `events.html` |
| 設定 | `settings.html` で通知・プライバシー変更 |
| 料金 | `pricing.html` で Pro を購入 (Stripe Test) |
| アナリティクス | `analytics.html?preview=1` (企業) |
| 通報 | 投稿/コメントの「…」→ 通報 |
| 通報キュー (admin) | `reports-admin.html` |
| 通知トースト | 誰かがあなたの求人に応募 → 右下にトースト |
| セマンティック検索 | `match_jobs` RPC を クライアントから呼ぶ |
| 週次ダイジェスト | pg_cron 設定 + Resend 設定後、毎週月曜に自動送信 |

---

## 9. トラブルシューティング

### 「Invalid login credentials」
そのメアドでまだ登録していない。`signup.html` で登録してから。

### 「Confirm email」が有効で届かない
開発中は Supabase Dashboard → Auth → Providers → Email → "Confirm email" を OFF に。

### pgvector が動かない
Dashboard → Database → Extensions で `vector` を手動で Enable。

### `reports-admin.html` で「読み込みエラー」
SQL で `update profiles set role='admin' where id='<uid>';` を実行。

### Stripe Checkout で 500 エラー
`STRIPE_SECRET_KEY` / `STRIPE_PRICE_PRO` の Secret が未設定。

### 週次ダイジェストが届かない
1. `pg_cron` / `pg_net` が有効か確認
2. Edge Function のログ: `supabase functions logs weekly-digest`
3. `RESEND_API_KEY` がセットされているか

---

## 10. Files ツリー (v3 で追加されたもの)

```
reference/
├── sql/
│   └── schema-v3.sql              ← 全機能スキーマ
├── js/
│   ├── supabase-v3.js             ← 新機能 API
│   └── aime-ui.js                 ← 通知トースト + 通報モーダル
├── edge-functions/
│   ├── README.md
│   ├── send-email/
│   ├── stripe-checkout/
│   ├── stripe-webhook/
│   ├── generate-embedding/
│   └── weekly-digest/
├── saved-searches.html            ← 保存検索一覧
├── events.html                    ← イベント一覧
├── event-detail.html              ← イベント詳細 + RSVP
├── analytics.html                 ← 企業向けアナリティクス
├── settings.html                  ← 通知/プライバシー設定
├── pricing.html                   ← 料金プラン + Stripe Checkout
├── reports-admin.html             ← 通報キュー (admin)
└── SETUP-V3.md                    ← 本ドキュメント
```

既存ページへの追加：

- `login.html` / `signup.html` — Google/LinkedIn/GitHub OAuth + Magic Link
- `company.html` — フォローボタン + レビューセクション
- `search.html` — 「＋ この検索を保存」ボタン
- `admin.html` — 通報ページへのナビリンク
- `mypage.html` / `company-dashboard.html` / `blog.html` — 通知トーストハンドラ
