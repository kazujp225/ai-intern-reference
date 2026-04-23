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
})();
