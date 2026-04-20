/* ==========================================================================
   realtime.js - Supabase Realtime 機能
   Presence（オンライン人数）と Broadcast（通知）を提供
   DBテーブル不要で動作
   ========================================================================== */
(function () {
  if (!window.sb) {
    console.warn('Supabase クライアント未初期化のため realtime.js は何もしません');
    return;
  }

  const sb = window.sb;
  const randomId = 'u_' + Math.random().toString(36).slice(2, 10);

  /* ---------- 1. サイト全体のオンライン人数 (Presence) ---------- */
  window.AImeRealtime = window.AImeRealtime || {};

  window.AImeRealtime.initSitePresence = function (onCountChange) {
    const channel = sb.channel('site-presence', {
      config: { presence: { key: randomId } },
    });
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        onCountChange(count);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ joined_at: new Date().toISOString() });
        }
      });
    return channel;
  };

  /* ---------- 2. 求人ごとのオンライン人数 (Per-job Presence) ---------- */
  window.AImeRealtime.initJobPresence = function (jobId, onCountChange) {
    const channel = sb.channel('job-' + jobId, {
      config: { presence: { key: randomId } },
    });
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        onCountChange(count);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ joined_at: new Date().toISOString() });
        }
      });
    return channel;
  };

  /* ---------- 3. 応募イベント通知 (Broadcast) ---------- */
  const applyChannel = sb.channel('applications');
  let applySubscribed = false;

  window.AImeRealtime.onApplyEvent = function (handler) {
    applyChannel.on('broadcast', { event: 'apply' }, (payload) => {
      handler(payload.payload || {});
    });
    if (!applySubscribed) {
      applyChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') applySubscribed = true;
      });
    }
  };

  window.AImeRealtime.sendApplyEvent = async function (data) {
    // 購読済みでない場合は先に購読
    if (!applySubscribed) {
      await new Promise((resolve) => {
        applyChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') { applySubscribed = true; resolve(); }
        });
      });
    }
    await applyChannel.send({
      type: 'broadcast',
      event: 'apply',
      payload: data,
    });
  };

  /* ---------- トースト UI ヘルパー ---------- */
  window.AImeRealtime.showToast = function (html, opts) {
    opts = opts || {};
    let container = document.getElementById('aime-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'aime-toast-container';
      container.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = 'background:#fff;color:#111;padding:14px 18px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.15);font-size:.9em;font-weight:700;border-left:4px solid #4caf50;max-width:340px;opacity:0;transform:translateX(-20px);transition:all .3s ease;pointer-events:auto;';
    toast.innerHTML = html;
    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-20px)';
      setTimeout(() => toast.remove(), 300);
    }, opts.duration || 5000);
  };
})();
