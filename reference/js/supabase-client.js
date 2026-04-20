/* ==========================================================================
   supabase-client.js - AIme 共通 Supabase クライアント
   URL と anon key は公開されても問題のないクライアント専用の設定
   ========================================================================== */
window.SUPABASE_URL = 'https://seidpqaehbzopdsoafkm.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaWRwcWFlaGJ6b3Bkc29hZmttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODEwNzYsImV4cCI6MjA5MjI1NzA3Nn0.A5sTu0dKZWG6SguMalf6YMr2Pz8mgH9p2LiR3nWoepA';

(function () {
  if (!window.supabase || !window.supabase.createClient) {
    console.error('Supabase SDK が読み込まれていません。先に supabase-js CDN を読み込んでください。');
    return;
  }
  window.sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
})();
