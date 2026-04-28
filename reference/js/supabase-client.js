/* ==========================================================================
   supabase-client.js - AIme 共通 Supabase クライアント
   設定は js/config.js の AIME_CONFIG.SUPABASE から読み込みます。
   ========================================================================== */
(function () {
  const cfg = window.AIME_CONFIG && window.AIME_CONFIG.SUPABASE;
  if (!cfg || !cfg.URL || !cfg.ANON_KEY) {
    console.error('[AIme] config.js が見つからないか、Supabase 設定が不完全です。<script src="js/config.js"></script> を先に読み込んでください。');
    return;
  }

  // 後方互換: 既存コードは window.SUPABASE_URL / window.SUPABASE_ANON_KEY を参照
  window.SUPABASE_URL = cfg.URL;
  window.SUPABASE_ANON_KEY = cfg.ANON_KEY;

  if (!window.supabase || !window.supabase.createClient) {
    console.error('Supabase SDK が読み込まれていません。先に supabase-js CDN を読み込んでください。');
    return;
  }
  window.sb = window.supabase.createClient(cfg.URL, cfg.ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
})();
