#!/bin/sh
# ==========================================================================
# entrypoint.sh — コンテナ起動時に ENV を config.js に注入
# nginx:alpine が /docker-entrypoint.d/*.sh を nginx 起動前に実行する仕組みを利用
# ==========================================================================
set -eu

TEMPLATE=/usr/share/nginx/html/js/config.template.js
TARGET=/usr/share/nginx/html/js/config.js

if [ ! -f "$TEMPLATE" ]; then
  echo "[entrypoint] ERROR: $TEMPLATE が見つかりません" >&2
  exit 1
fi

# ENV 未設定ならエラーで起動失敗させる (本番で空デプロイを防ぐ)
: "${SUPABASE_URL:?SUPABASE_URL env var is required}"
: "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY env var is required}"

# プレースホルダを実値に置換して config.js を生成
sed \
  -e "s|__SUPABASE_URL__|${SUPABASE_URL}|g" \
  -e "s|__SUPABASE_ANON_KEY__|${SUPABASE_ANON_KEY}|g" \
  "$TEMPLATE" > "$TARGET"

# 検証: プレースホルダが残っていないか
if grep -q "__SUPABASE_" "$TARGET"; then
  echo "[entrypoint] ERROR: プレースホルダが残っています" >&2
  exit 1
fi

echo "[entrypoint] ✓ config.js を生成しました (SUPABASE_URL=${SUPABASE_URL})"
