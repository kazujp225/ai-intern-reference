/* ==========================================================================
   aime-ui.js — 全ページ共通の UI ヘルパー
   - 通知トースト (Realtime 通知受信時)
   - 通報モーダル (共通)
   - OAuth / Magic Link ボタン生成
   前提: supabase-client.js + supabase-v3.js + supabase-social.js が先にロード済み
   ========================================================================== */
(function () {
  // =========================================================
  // グローバル エラーハンドリング
  // =========================================================
  window.addEventListener('error', (e) => {
    console.error('[AIme error]', e.error || e.message);
    try { showToast(`エラーが発生しました。<br><small>${(e.error?.message || e.message || '').slice(0,80)}</small>`, { kind: 'error', duration: 4000 }); } catch {}
  });
  window.addEventListener('unhandledrejection', (e) => {
    console.error('[AIme unhandled promise]', e.reason);
    try { showToast(`通信エラーが発生しました。<br><small>${(e.reason?.message || '').slice(0,80)}</small>`, { kind: 'error', duration: 4000 }); } catch {}
  });

  if (!window.sb) return;
  const sb = window.sb;

  // =========================================================
  // トースト (画面右下)
  // =========================================================
  function ensureToastContainer() {
    let c = document.getElementById('aime-toast-container');
    if (c) return c;
    c = document.createElement('div');
    c.id = 'aime-toast-container';
    c.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;max-width:340px;';
    document.body.appendChild(c);
    return c;
  }
  function showToast(html, options = {}) {
    const container = ensureToastContainer();
    const el = document.createElement('div');
    el.style.cssText = `
      background:#fff;border-radius:14px;padding:14px 16px;
      box-shadow:0 10px 30px rgba(0,0,0,.15);
      border-left:4px solid ${options.kind === 'success' ? '#2e7d32' : options.kind === 'error' ? '#c62828' : '#4caf50'};
      font-size:.88em;line-height:1.5;max-width:340px;
      opacity:0;transform:translateY(12px);
      transition:opacity .25s,transform .25s;
    `;
    el.innerHTML = html;
    container.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    setTimeout(() => {
      el.style.opacity = '0'; el.style.transform = 'translateY(12px)';
      setTimeout(() => el.remove(), 300);
    }, options.duration || 5000);
  }
  window.aimeToast = showToast;

  // =========================================================
  // Realtime: 自分宛通知を購読してトースト
  // =========================================================
  (async function initNotifSubscribe() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    sb.channel('aime-my-notifs-' + user.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const n = payload.new;
        showToast(`
          <div style="font-family:monospace;font-size:.72em;font-weight:800;color:#2e7d32;letter-spacing:1px;margin-bottom:4px;">新着通知</div>
          <div style="font-weight:800;">${escapeHtml(n.title)}</div>
          <div style="color:#666;font-size:.88em;margin-top:2px;">${escapeHtml(n.body || '')}</div>
          ${n.link ? `<a href="${n.link}" style="color:#2e7d32;font-size:.82em;font-weight:700;">詳細 →</a>` : ''}
        `, { kind: 'success', duration: 6000 });
      })
      .subscribe();
  })();

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // =========================================================
  // 通報モーダル
  // =========================================================
  function openReportModal(targetType, targetId) {
    if (document.getElementById('aime-report-modal')) return;
    const m = document.createElement('div');
    m.id = 'aime-report-modal';
    m.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;">
        <div style="background:#fff;border-radius:16px;padding:28px;max-width:420px;width:100%;box-shadow:0 20px 50px rgba(0,0,0,.2);">
          <h3 style="margin:0 0 6px;font-size:1.2em;font-weight:900;">通報</h3>
          <p style="color:#666;margin:0 0 18px;font-size:.88em;">この${targetLabel(targetType)}を通報します。運営チームが確認します。</p>
          <label style="display:block;font-size:.85em;font-weight:800;margin-bottom:6px;">理由</label>
          <select id="ar-reason" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:8px;font-size:.95em;margin-bottom:14px;">
            <option value="spam">スパム</option>
            <option value="harassment">嫌がらせ・誹謗中傷</option>
            <option value="inappropriate">不適切なコンテンツ</option>
            <option value="misinformation">虚偽の情報</option>
            <option value="other">その他</option>
          </select>
          <label style="display:block;font-size:.85em;font-weight:800;margin-bottom:6px;">詳細 (任意)</label>
          <textarea id="ar-detail" placeholder="具体的な内容を記載" style="width:100%;padding:10px;border:1px solid #e0e0e0;border-radius:8px;font-size:.95em;min-height:80px;resize:vertical;margin-bottom:14px;font-family:inherit;"></textarea>
          <div id="ar-msg" style="display:none;padding:8px 12px;border-radius:6px;font-size:.85em;font-weight:700;margin-bottom:12px;"></div>
          <div style="display:flex;gap:10px;justify-content:flex-end;">
            <button id="ar-cancel" style="padding:10px 20px;background:#eee;border:none;border-radius:8px;font-weight:800;cursor:pointer;">キャンセル</button>
            <button id="ar-submit" style="padding:10px 20px;background:#c62828;color:#fff;border:none;border-radius:8px;font-weight:800;cursor:pointer;">通報する</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(m);
    const close = () => m.remove();
    m.querySelector('#ar-cancel').onclick = close;
    m.firstElementChild.addEventListener('click', (e) => { if (e.target === m.firstElementChild) close(); });
    m.querySelector('#ar-submit').onclick = async () => {
      const reason = m.querySelector('#ar-reason').value;
      const detail = m.querySelector('#ar-detail').value.trim();
      const msg = m.querySelector('#ar-msg');
      msg.style.display = 'none';
      try {
        await window.AImeV3.report(targetType, targetId, reason, detail);
        msg.textContent = '✓ 通報を受け付けました';
        msg.style.background = '#e8f5e9'; msg.style.color = '#1b5e20'; msg.style.display = 'block';
        setTimeout(close, 1200);
      } catch (err) {
        msg.textContent = 'エラー: ' + err.message;
        msg.style.background = '#ffebee'; msg.style.color = '#c62828'; msg.style.display = 'block';
      }
    };
  }
  function targetLabel(t) {
    return { post:'投稿', comment:'コメント', message:'メッセージ', user:'ユーザー', job:'求人', review:'レビュー' }[t] || 'コンテンツ';
  }
  window.aimeOpenReport = openReportModal;

  // =========================================================
  // data-report="targetType:targetId" 属性を持つボタンを自動配線
  // =========================================================
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-report]');
    if (!btn) return;
    e.preventDefault();
    const [type, id] = btn.dataset.report.split(':');
    openReportModal(type, id);
  });
})();
