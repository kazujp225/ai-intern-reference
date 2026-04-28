# ==========================================================================
# AIme — Render Web Service 用 Docker イメージ
# nginx で静的配信 + コンテナ起動時に ENV を config.js に注入
# ==========================================================================
FROM nginx:1.27-alpine

# 静的アセットをコピー
COPY reference /usr/share/nginx/html

# nginx 設定 (Render は $PORT を ENV で渡してくるので対応)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# 起動時に ENV を config.js に注入するスクリプト
COPY entrypoint.sh /docker-entrypoint.d/99-inject-env.sh
RUN chmod +x /docker-entrypoint.d/99-inject-env.sh

# Render は $PORT (デフォルト 10000) で待受させたい
ENV PORT=10000
EXPOSE 10000

# nginx:alpine 標準の entrypoint が /docker-entrypoint.d/*.sh を実行してから起動
CMD ["nginx", "-g", "daemon off;"]
