/* ==========================================================================
   config.template.js — config.js のテンプレート（Git コミット対象）
   Docker コンテナ起動時に entrypoint.sh が ENV 値を注入して config.js を生成
   ローカル開発時は生成済み config.js を直接参照
   ========================================================================== */
window.AIME_CONFIG = {
  // ==========================================================
  // Supabase — Render Web Service の ENV から起動時に注入
  // ==========================================================
  SUPABASE: {
    URL:      '__SUPABASE_URL__',
    ANON_KEY: '__SUPABASE_ANON_KEY__',
  },

  // ==========================================================
  // サイト / 会社情報 — 実在の情報に差し替えてください
  // 特定商取引法・プライバシーポリシー・お問い合わせ先に使用
  // ==========================================================
  SITE: {
    NAME:          'AIme',                            // サイト名
    TAGLINE:       'AI特化インターン求人サイト',        // サイトの説明
    URL:           'https://aime.example',            // 本番URL (httpsから)
  },

  COMPANY: {
    NAME:          '株式会社AIme',                    // 運営会社名
    CEO:           '山田 太郎',                       // 代表者氏名
    REG_NUMBER:    '',                                // 募集情報等提供事業届出番号 (例: 13-募-300000)
    POSTAL_CODE:   '150-0001',                        // 郵便番号
    ADDRESS:       '東京都渋谷区神宮前 1-2-3 AIme ビル 5F',  // 所在地
    TEL:           '03-0000-0000',                    // 代表電話
    TEL_HOURS:     '平日 10:00〜18:00（土日祝除く）',
    FOUNDED:       '2026年1月1日',                    // 設立日
  },

  EMAIL: {
    SUPPORT:  'support@aime.example',                 // お問い合わせ先
    PRIVACY:  'privacy@aime.example',                 // 個人情報保護窓口
    NOREPLY:  'no-reply@aime.example',                // 送信元メール
    DOMAIN:   'aime.example',                         // メール独自ドメイン
  },

  // ==========================================================
  // 機能フラグ — 有効化までは false にしておくと安全
  // ==========================================================
  FEATURES: {
    STRIPE_PRICING:   false,   // Stripe 未セットアップ時は false (pricing.html が誘導のみ)
    SEMANTIC_SEARCH:  false,   // OpenAI Edge Function 未デプロイ時は false
    WEEKLY_DIGEST:    false,   // Resend Edge Function 未デプロイ時は false
    COMPANY_REVIEWS:  true,    // 企業レビュー表示
    EVENTS:           true,    // イベント機能
  },

  // ==========================================================
  // SNS / 外部リンク — 未使用なら空でOK
  // ==========================================================
  SOCIAL: {
    TWITTER:  '',
    GITHUB:   '',
    NOTE:     '',
  },
};

// プレースホルダを data 属性で DOM に注入するヘルパ
// 使い方: <span data-aime="COMPANY.NAME"></span>
(function applyConfigToDOM() {
  function resolve(path) {
    return path.split('.').reduce((o, k) => o && o[k], window.AIME_CONFIG);
  }
  function apply() {
    document.querySelectorAll('[data-aime]').forEach(el => {
      const val = resolve(el.dataset.aime);
      if (val !== undefined && val !== null && val !== '') {
        el.textContent = val;
      }
    });
    // <a data-aime-href="EMAIL.SUPPORT"> → mailto: を自動生成
    document.querySelectorAll('[data-aime-href]').forEach(el => {
      const val = resolve(el.dataset.aimeHref);
      if (val) {
        const isEmail = el.dataset.aimeHref.startsWith('EMAIL.');
        el.href = isEmail ? 'mailto:' + val : val;
      }
    });
    // <meta data-aime-content="SITE.NAME"> など
    document.querySelectorAll('[data-aime-content]').forEach(el => {
      const val = resolve(el.dataset.aimeContent);
      if (val) el.setAttribute('content', val);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();

// 警告: デフォルト値のまま本番運用するのを防ぐ
(function warnIfDefaults() {
  const u = window.AIME_CONFIG.SUPABASE.URL;
  const k = window.AIME_CONFIG.SUPABASE.ANON_KEY;
  if (u.includes('YOUR-PROJECT-REF') || k.includes('YOUR-ANON-KEY')) {
    console.warn('[AIme] ⚠️ config.js の Supabase URL/ANON_KEY がデフォルトのままです。本番運用前に必ず差し替えてください。');
  }
})();
