# AIme — 15分で本番デプロイする手順

このファイルの通りに進めれば、最短 **15〜30分** で AIme を本番公開できます。

---

## 📋 事前チェック

- [ ] 運営する会社情報（住所・代表者名・メール）を決めている
- [ ] クレジットカード（Vercel 無料プラン登録用）
- [ ] GitHub アカウント（Vercel 連携用）
- [ ] Google アカウント（OAuth 登録用）

---

## STEP 1: Supabase プロジェクト作成（5分）

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) にアクセス
2. 「New Project」をクリック
3. プロジェクト名: `aime` など
4. データベースパスワード: 強固なものを設定（メモ必須）
5. Region: `Northeast Asia (Tokyo)`
6. 「Create new project」→ 完了まで 1〜2分待つ

**完了後に取得するもの：**

- Settings → API → `Project URL`
- Settings → API → `Project API keys` → `anon` `public` キー

→ 次のステップで `config.js` に貼り付けます。

---

## STEP 2: config.js を埋める（2分）

`js/config.js` を開いて以下を実在の値に書き換え：

```js
SUPABASE: {
  URL:      'https://xxxxxxxxxxxx.supabase.co',   // ← Project URL
  ANON_KEY: 'eyJhbGci...',                        // ← anon public key
},
COMPANY: {
  NAME:        '株式会社あなたの会社',
  CEO:         '山田 太郎',
  REG_NUMBER:  '',        // 後で取得 (届出後記入)
  POSTAL_CODE: '150-0001',
  ADDRESS:     '東京都渋谷区xx-x-x',
  TEL:         '03-1234-5678',
  ...
},
EMAIL: {
  SUPPORT:  'support@your-domain.com',
  PRIVACY:  'privacy@your-domain.com',
  ...
},
SITE: {
  URL: 'https://your-domain.com',
  ...
}
```

---

## STEP 3: SQL スキーマ実行（3分）

Supabase Dashboard → **SQL Editor** → New query で **3回** 実行（順番厳守）：

1. `sql/schema.sql` の中身を全選択 → 貼り付け → Run
2. `sql/schema-v2.sql` の中身を全選択 → 貼り付け → Run
3. `sql/schema-v3.sql` の中身を全選択 → 貼り付け → Run

すべて「Success. No rows returned」になれば OK。

---

## STEP 4: Google OAuth 設定（5分）

### 4-1. Google Cloud Console で OAuth Client 作成

1. [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) にアクセス
2. 「OAuth 2.0 クライアント ID を作成」
3. アプリケーションの種類: **ウェブアプリケーション**
4. 承認済みリダイレクト URI に追加: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
   （YOUR-PROJECT-REF は Supabase の Project URL の `https://` と `.supabase.co` の間の文字列）
5. クライアント ID / クライアント シークレットをコピー

### 4-2. Supabase に登録

1. Supabase Dashboard → **Authentication** → **Providers** → **Google**
2. 「Enable Sign in with Google」を ON
3. Client ID と Client Secret を貼り付け → Save

### 4-3. Email 確認設定

1. Authentication → Providers → **Email**
2. 「Confirm email」を ON（本番推奨）または OFF（テスト中なら）
3. Save

---

## STEP 5: 法務ページの会社情報を確認（1分）

`config.js` に書いた情報が `tokushoho.html` / `privacy.html` に自動反映されます。ブラウザでローカル確認：

```bash
cd /path/to/reference
python3 -m http.server 8000
# http://localhost:8000/tokushoho.html を開く
```

会社名・住所・メールが正しく表示されていれば OK。

---

## STEP 6: Vercel にデプロイ（5分）

### 6-1. GitHub に push

```bash
cd /path/to/reference
git init
git add .
git commit -m "Initial AIme deploy"
gh repo create aime --public --source=. --remote=origin --push
# または手動で github.com で repo 作成 → push
```

### 6-2. Vercel でインポート

1. [https://vercel.com/new](https://vercel.com/new) にアクセス
2. GitHub 連携 → 作ったリポジトリを選択
3. Framework Preset: **Other**
4. Root Directory: そのまま（ルート）
5. 「Deploy」

→ `https://aime-xxx.vercel.app` が発行されます。

### 6-3. カスタムドメインを紐付け（オプション）

1. Vercel プロジェクト → Settings → Domains
2. ドメインを入力 → 指示に従って DNS を設定
3. 伝播後、`https://your-domain.com` で公開

---

## STEP 7: 動作確認（3分）

1. `https://your-domain.com` にアクセス → トップページ表示
2. `/signup.html` → 新規登録（テスト用メアドで）
3. 確認メール → リンククリック → ログイン成功
4. `/company-signup.html` → 企業登録
5. 企業ダッシュボードから **求人を1件作成**
6. ログアウト → `/search.html` で作った求人が表示されること確認
7. 応募ボタン → 応募成立

ここまで動けば **サービスとして成立** です。

---

## STEP 8: 法的手続き（並行作業: 2週間〜）

### 募集情報等提供事業届出（求人サイト運営必須）

1. 厚生労働省 [募集情報等提供事業のページ](https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/jigyounushi/page13_00001.html) を確認
2. 届出書を作成（書式は上記リンクからダウンロード）
3. 管轄ハローワークに郵送・持参
4. 受理後に**届出番号**が通知される（通常 1〜2週間）
5. 番号を `config.js` の `COMPANY.REG_NUMBER` に記載 → Git push で自動反映

---

## トラブルシューティング

### ログインで「Invalid login credentials」
→ そのメアドで未登録。`/signup.html` で先に登録。

### 「Confirm email」メールが届かない
→ Supabase Dashboard → Authentication → Email Templates で送信元ドメインと内容確認。**本番は Resend または SMTP 設定必須**（Supabase デフォルトは開発用で制限あり）。

### 検索で求人が表示されない
→ SQL マイグレーション未実行 or 求人を公開状態 (`status=approved, is_public=true, is_draft=false`) で投稿できていない。

### 画像アップロードで 403
→ Storage バケット未作成 or RLS ポリシー未適用。`schema-v3.sql` を再実行。

### Google OAuth で「redirect_uri_mismatch」
→ Google Cloud の Redirect URI が `https://xxx.supabase.co/auth/v1/callback` で一致しているか確認。

### Realtime 通知が来ない
→ Supabase Dashboard → Database → Replication → `notifications` テーブルの Realtime を ON。

---

## Optional: メール・課金・AI検索

すべて後から追加できます。必要になったら `SETUP-V3.md` を参照。

| 機能 | 必要な外部サービス | 月額目安 |
|---|---|---|
| メール送信 (Resend) | [resend.com](https://resend.com) 無料枠 3000通/月 | 無料〜 |
| 課金 (Stripe) | [stripe.com](https://stripe.com) | 手数料 3.6% |
| セマンティック検索 | [OpenAI API](https://platform.openai.com) | $0.02 / 1M tokens |

---

## チェックリスト (本番前最終確認)

- [ ] `config.js` の Supabase URL/ANON_KEY を実値に変更
- [ ] `config.js` の COMPANY.* / EMAIL.* を実値に変更
- [ ] schema.sql / v2 / v3 を順番通り実行済み
- [ ] Storage バケット `logos`, `covers`, `avatars`, `resumes`, `portfolios` が存在
- [ ] Google OAuth Provider が有効
- [ ] Email Confirm が ON
- [ ] `tokushoho.html` / `privacy.html` に会社情報が表示される
- [ ] `/signup.html` → `/login.html` → `/mypage.html` が動く
- [ ] `/company-signup.html` → `/company-dashboard.html` → 求人投稿が動く
- [ ] 投稿した求人が `/search.html` に表示される
- [ ] 応募ボタン → 企業側に通知が届く
- [ ] 募集情報等提供事業届出 申請済み or 受理済み

これが全部チェックされたら **本番公開 OK** です。
