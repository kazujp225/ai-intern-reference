/* ==========================================================================
   mobile-nav.js — 全ページ共通のフロスト風ボトムナビをDOMに注入
   ========================================================================== */
(function () {
  if (document.getElementById('mobile-bottom-nav')) return;

  const items = [
    { href: 'search.html',    label: '求人',      icon: 'job',
      matches: ['search.html', 'job.html'] },
    { href: 'companies.html', label: '企業',      icon: 'company',
      matches: ['companies.html', 'company.html'] },
    { href: 'blog.html',      label: 'コラム',    icon: 'column',
      matches: ['blog.html', 'post.html'] },
    { href: 'messages.html',  label: 'メッセージ', icon: 'message',
      matches: ['messages.html'] },
    { href: 'mypage.html',    label: 'マイページ', icon: 'user',
      matches: ['mypage.html', 'settings.html', 'saved-searches.html',
                'notifications.html'] },
  ];

  const ICONS = {
    job: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><line x1="2" y1="13" x2="22" y2="13"/>',
    company: '<rect x="4" y="3" width="16" height="18" rx="1"/><line x1="9" y1="7" x2="9.01" y2="7"/><line x1="15" y1="7" x2="15.01" y2="7"/><line x1="9" y1="11" x2="9.01" y2="11"/><line x1="15" y1="11" x2="15.01" y2="11"/><line x1="9" y1="15" x2="9.01" y2="15"/><line x1="15" y1="15" x2="15.01" y2="15"/><path d="M10 21v-3h4v3"/>',
    column: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  };

  const currentFile = (location.pathname.split('/').pop() || 'original.html').toLowerCase();

  const nav = document.createElement('nav');
  nav.id = 'mobile-bottom-nav';
  nav.className = 'mobile-bottom-nav';
  nav.setAttribute('aria-label', 'モバイルメインナビゲーション');
  nav.innerHTML = '<div class="mbn-inner">' + items.map(it => {
    const isActive = it.matches.includes(currentFile) ? ' active' : '';
    return `<a href="${it.href}" class="${isActive.trim()}"${isActive?' aria-current="page"':''}>`
      + `<svg viewBox="0 0 24 24">${ICONS[it.icon]}</svg>`
      + `<span>${it.label}</span>`
      + `</a>`;
  }).join('') + '</div>';

  function insert() { document.body.appendChild(nav); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insert);
  } else {
    insert();
  }

  // =======================================================
  // 横幅オーバー要素を自動検知して強制クランプ (モバイルのみ)
  // =======================================================
  function clampOverflow() {
    if (window.innerWidth > 900) return;
    const vw = document.documentElement.clientWidth;
    const SKIP_SEL = '.student-voice-carousel, .compact-tabs, .bl-toolbar, table, [data-allow-x-scroll], .mobile-bottom-nav, .usa-map-wrap';
    const violators = [];
    // --- Pass 1: 全要素の寸法チェック、違反者を記録 ---
    document.querySelectorAll('body *').forEach(el => {
      if (el.closest(SKIP_SEL)) return;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const cssW = parseFloat(cs.width);
      const cssMinW = parseFloat(cs.minWidth);
      const over = (r.width > vw + 1) || (r.right > vw + 1) || (r.left < -1)
                 || (cssW > vw + 10) || (cssMinW > vw + 10);
      if (over) {
        violators.push({ el, r, cssW, cssMinW });
      }
    });
    // --- Pass 2: 違反者を全部矯正 ---
    violators.forEach(({ el, r }) => {
      el.style.setProperty('max-width', '100%', 'important');
      el.style.setProperty('width', 'auto', 'important');
      el.style.setProperty('min-width', '0', 'important');
      el.style.setProperty('overflow-x', 'hidden', 'important');
      el.style.setProperty('box-sizing', 'border-box', 'important');
      if (r.left < 0 || r.right > vw + 1) {
        el.style.setProperty('margin-left', '0', 'important');
        el.style.setProperty('margin-right', '0', 'important');
        el.style.setProperty('transform', 'none', 'important');
        el.style.setProperty('left', 'auto', 'important');
        el.style.setProperty('right', 'auto', 'important');
        const pos = getComputedStyle(el).position;
        if (pos === 'absolute' || pos === 'fixed') {
          el.style.setProperty('position', 'static', 'important');
        }
      }
    });
    // --- Pass 3: ルートレベルの保険 ---
    document.documentElement.style.setProperty('overflow-x', 'clip', 'important');
    document.body.style.setProperty('overflow-x', 'clip', 'important');
    document.documentElement.style.setProperty('max-width', '100vw', 'important');
    document.body.style.setProperty('max-width', '100vw', 'important');
    // --- デバッグ: bodyがまだviewportを超えてたらwarnを出す ---
    if (document.body.scrollWidth > vw + 1) {
      // 残留している最大幅の子孫を特定
      let worst = null, maxW = vw;
      document.querySelectorAll('body *').forEach(el => {
        if (el.closest(SKIP_SEL)) return;
        const r = el.getBoundingClientRect();
        if (r.right > maxW) { maxW = r.right; worst = el; }
      });
      if (worst) {
        console.warn('[mobile-nav] still overflowing:',
          worst.tagName + (worst.className ? '.' + String(worst.className).replace(/\s/g,'.') : '') + (worst.id ? '#'+worst.id : ''),
          'right:', maxW, 'vw:', vw);
        // 最後の手段: 違反者に width: 100vw; position: relative; left: 0
        worst.style.setProperty('width', '100vw', 'important');
        worst.style.setProperty('max-width', '100vw', 'important');
        worst.style.setProperty('position', 'relative', 'important');
        worst.style.setProperty('left', '0', 'important');
      }
    }
  }
  function runClamp() {
    clampOverflow();
    // レンダリング後・画像読込後にも再実行
    setTimeout(clampOverflow, 200);
    setTimeout(clampOverflow, 800);
    setTimeout(clampOverflow, 2000);
  }
  window.addEventListener('load', runClamp);
  window.addEventListener('resize', runClamp);
  if (document.readyState === 'complete') runClamp();

  // DOM変化を監視して後挿入要素にも対応 (Vue / slick等の遅延描画対策)
  let debounce = null;
  const mo = new MutationObserver(() => {
    if (window.innerWidth > 900) return;
    clearTimeout(debounce);
    debounce = setTimeout(clampOverflow, 200);
  });
  if (document.body) {
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    });
  }

  // =======================================================
  // AImeシップを探す: モバイル専用アコーディオン化
  // =======================================================
  function initSearchAccordion() {
    if (window.innerWidth > 900) return;
    const section = document.querySelector('.search-interns-new');
    if (!section || section.dataset.accordionReady === '1') return;
    const labels = section.querySelectorAll('.search-category-label');
    if (labels.length === 0) return;

    let first = true;
    labels.forEach(label => {
      // 次の兄弟 (brutal-row か エリアflex div) を body として使う
      const body = label.nextElementSibling;
      if (!body) return;

      // すでにアコーディオン化済みならスキップ
      if (label.parentElement.classList.contains('aime-acc')) return;

      // 件数を計算
      let count = 0;
      const chips = body.querySelectorAll('a');
      count = chips.length;
      // 動的populationに備え、0なら後で更新
      const countText = count > 0 ? `${count}件` : '';

      // ラッパを作成
      const wrap = document.createElement('div');
      wrap.className = 'aime-acc' + (first ? ' open' : '');
      first = false;

      // 元の位置を保持してwrap内に移動
      label.parentNode.insertBefore(wrap, label);
      // ヘッダー作成
      const head = document.createElement('div');
      head.className = 'aime-acc-head';
      head.appendChild(label);
      const badge = document.createElement('span');
      badge.className = 'aime-acc-count';
      badge.textContent = countText;
      head.appendChild(badge);
      // 矢印
      const arrow = document.createElement('span');
      arrow.className = 'aime-acc-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      head.appendChild(arrow);
      wrap.appendChild(head);

      // ボディ作成
      const bodyWrap = document.createElement('div');
      bodyWrap.className = 'aime-acc-body';
      bodyWrap.appendChild(body);
      wrap.appendChild(bodyWrap);

      // クリックでトグル
      head.addEventListener('click', () => {
        wrap.classList.toggle('open');
      });
      head.style.cursor = 'pointer';
    });

    section.dataset.accordionReady = '1';

    // 後から動的に chip が追加された場合の count 更新監視
    const updateCounts = () => {
      section.querySelectorAll('.aime-acc').forEach(wrap => {
        const cnt = wrap.querySelectorAll('.aime-acc-body a').length;
        const b = wrap.querySelector('.aime-acc-count');
        if (b && cnt > 0) b.textContent = cnt + '件';
      });
    };
    setTimeout(updateCounts, 500);
    setTimeout(updateCounts, 1500);
  }
  window.addEventListener('load', initSearchAccordion);
  document.addEventListener('DOMContentLoaded', initSearchAccordion);
  setTimeout(initSearchAccordion, 100);
  setTimeout(initSearchAccordion, 800);

  // =======================================================
  // モバイル時、スマホ型デモ (.phone-filter-row) の親ラッパごと非表示
  // =======================================================
  function hidePhoneDemo() {
    if (window.innerWidth > 900) return;
    const pf = document.querySelector('.phone-filter-row');
    if (pf && pf.parentElement) {
      pf.parentElement.style.setProperty('display', 'none', 'important');
    }
  }
  window.addEventListener('load', hidePhoneDemo);
  document.addEventListener('DOMContentLoaded', hidePhoneDemo);
  setTimeout(hidePhoneDemo, 200);
})();
