# AIme デプロイ手順（Render Web Service）

## 0. 前提: この手順を始める前に

- [ ] Supabase ダッシュボードにオーナー権限でログイン可能
- [ ] Render アカウントがあり、GitHub リポジトリと連携済み
- [ ] git push 権限がある

---

## Phase 1. Supabase 側: キー再生成（漏洩したキーの無効化）

過去の Git 履歴に anon key がコミットされているため、必ず再生成してください。

1. Supabase Dashboard → **Settings → API**
   - https://supabase.com/dashboard/project/onqhwinvdaokspdsovzc/settings/api
2. `anon` `public` の行の **↻ Reset** をクリック
3. 新しい anon key をコピー（後で Render に登録）
4. **古いキーは即座に無効化** される

---

## Phase 2. Supabase 側: SQL スキーマ適用

Dashboard → **SQL Editor** → **New query** で順に実行：

1. `reference/sql/schema.sql`
2. `reference/sql/schema-v2.sql`
3. `reference/sql/schema-v3.sql`

各ファイルの全文をコピペ → Run。エラーなく通ることを確認。

---

## Phase 3. Git の掃除＋プッシュ

ローカルで実行：

```bash
cd /Users/kaisha/ai-intern-reference

# 生成された config.js (キー入り) を Git 管理から外す
git rm --cached reference/js/config.js 2>/dev/null || true

# 新規ファイルを追加
git add Dockerfile nginx.conf entrypoint.sh .dockerignore .gitignore .env.example DEPLOY.md
git add reference/js/config.template.js

git commit -m "Web Service化: Docker + entrypointでENV注入、config.jsをGit除外"
git push origin main
```

---

## Phase 4. Render: Web Service 作成

1. Render Dashboard → **New → Web Service**
2. リポジトリ: `kazujp225/ai-intern-reference` を選択
3. 入力：

| 項目 | 値 |
|---|---|
| Name | `ai-intern-reference` |
| Language | **Docker** |
| Branch | `main` |
| Region | Singapore |
| Root Directory | （空欄）|
| Dockerfile Path | `./Dockerfile` |
| Instance Type | Free |

4. **Environment Variables** に追加：

| Key | Value |
|---|---|
| `SUPABASE_URL` | `https://onqhwinvdaokspdsovzc.supabase.co` |
| `SUPABASE_ANON_KEY` | **Phase 1 で再生成した新しいキー** |

5. **Create Web Service** をクリック
6. ビルド完了後、発行された URL（例 `https://ai-intern-reference.onrender.com`）を控える

---

## Phase 5. Supabase 側: 本番ドメイン許可

1. Dashboard → **Authentication → URL Configuration**
   - Site URL: `https://ai-intern-reference.onrender.com`
   - Redirect URLs:
     - `https://ai-intern-reference.onrender.com/**`
     - `http://localhost:4321/**`（開発用に残す）

2. Dashboard → **Authentication → Providers → Email**
   - 開発初期は `Confirm email` OFF
   - 本番公開時は `Confirm email` ON（スパム防止）

---

## Phase 6. 動作確認

1. `https://ai-intern-reference.onrender.com/original.html` を開く
2. DevTools Network タブで `onqhwinvdaokspdsovzc.supabase.co` へのリクエストが成功していること
3. 新規登録 → ログイン → マイページ遷移まで通ること
4. RLS が効いていることを curl で確認：

```bash
curl -s "https://onqhwinvdaokspdsovzc.supabase.co/rest/v1/profiles?select=*&limit=1" \
  -H "apikey: <新しいANON_KEY>" \
  -H "Authorization: Bearer <新しいANON_KEY>"
# → 未ログインでは自分のprofilesのみ or 空レスポンスになるのが期待値
```

---

## トラブルシュート

### ビルド失敗: `entrypoint.sh: Permission denied`
→ `chmod +x entrypoint.sh` してコミットし直す

### 起動失敗: `SUPABASE_URL env var is required`
→ Render の Environment Variables 設定漏れ

### 500 エラー
→ Render のログタブで nginx エラーを確認

### ログイン後に CORS エラー
→ Phase 5 の Redirect URLs に本番ドメインが入っていない

---

## ローカル開発の再開手順

Docker は不要。以下を実行すれば今まで通り `localhost:4321` で動く：

```bash
# 手動で config.js を生成（一度だけ）
cp reference/js/config.template.js reference/js/config.js

# エディタで config.js の __SUPABASE_URL__ と __SUPABASE_ANON_KEY__ を
# 新しいキーに置き換える (このファイルは .gitignore 済)

# サーバ起動
cd reference && npx http-server . -p 4321 -c-1
```
