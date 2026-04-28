window.AIME_CONFIG = {
  SUPABASE: {
    URL:      'https://ebabjbaibbbgwnopkdiw.supabase.co',
    ANON_KEY: 'sb_publishable_7KxUWiRNu-fxSBUpL44iZw_7KNMyFj5',
  },

  SITE: {
    NAME:          'AIme',
    TAGLINE:       'AI特化インターン求人サイト',
    URL:           'https://ai-intern-reference-1.onrender.com',
  },

  COMPANY: {
    NAME:          '株式会社AIme',
    CEO:           '',
    REG_NUMBER:    '',
    POSTAL_CODE:   '',
    ADDRESS:       '',
    TEL:           '',
    TEL_HOURS:     '',
    FOUNDED:       '',
  },

  EMAIL: {
    SUPPORT:  '',
    PRIVACY:  '',
    NOREPLY:  '',
    DOMAIN:   '',
  },

  FEATURES: {
    STRIPE_PRICING:   false,
    SEMANTIC_SEARCH:  false,
    WEEKLY_DIGEST:    false,
    COMPANY_REVIEWS:  true,
    EVENTS:           true,
  },

  SOCIAL: {
    TWITTER:  '',
    GITHUB:   '',
    NOTE:     '',
  },
};

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
    document.querySelectorAll('[data-aime-href]').forEach(el => {
      const val = resolve(el.dataset.aimeHref);
      if (val) {
        const isEmail = el.dataset.aimeHref.startsWith('EMAIL.');
        el.href = isEmail ? 'mailto:' + val : val;
      }
    });
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
