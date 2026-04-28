/* ==========================================================================
   supabase-v3.js — AIme v3 機能の API 層
   follows / saved_searches / reviews / events / reports / settings /
   endorsements / semantic search / notifications realtime
   前提: supabase-client.js が先にロードされていること
   ========================================================================== */
(function () {
  if (!window.sb) { console.warn('Supabase 未初期化'); return; }
  const sb = window.sb;

  async function getUser() {
    const { data } = await sb.auth.getUser();
    return data?.user || null;
  }

  window.AImeV3 = {
    getUser,

    // ============================================================
    // フォロー (企業 / ユーザー)
    // ============================================================
    async follow(targetType, targetId) {
      const u = await getUser(); if (!u) throw new Error('ログインが必要です');
      const { error } = await sb.from('follows').insert({
        follower_id: u.id, target_type: targetType, target_id: targetId,
      });
      if (error && error.code !== '23505') throw error;
    },
    async unfollow(targetType, targetId) {
      const u = await getUser(); if (!u) throw new Error('ログインが必要です');
      const { error } = await sb.from('follows').delete()
        .match({ follower_id: u.id, target_type: targetType, target_id: targetId });
      if (error) throw error;
    },
    async isFollowing(targetType, targetId) {
      const u = await getUser(); if (!u) return false;
      const { data } = await sb.from('follows').select('id')
        .match({ follower_id: u.id, target_type: targetType, target_id: targetId })
        .limit(1).maybeSingle();
      return !!data;
    },
    async countFollowers(targetType, targetId) {
      const { count } = await sb.from('follows')
        .select('id', { count: 'exact', head: true })
        .match({ target_type: targetType, target_id: targetId });
      return count || 0;
    },
    async listFollowing(kind /* 'company' | 'user' */) {
      const u = await getUser(); if (!u) return [];
      const { data } = await sb.from('follows').select('*')
        .match({ follower_id: u.id, target_type: kind })
        .order('created_at', { ascending: false });
      return data || [];
    },

    // ============================================================
    // 保存検索 (新着アラート)
    // ============================================================
    async saveSearch(label, params, alertEnabled = true) {
      const u = await getUser(); if (!u) throw new Error('ログインが必要です');
      const { data, error } = await sb.from('saved_searches').insert({
        user_id: u.id, label, params, alert: alertEnabled,
      }).select().single();
      if (error) throw error;
      return data;
    },
    async listSavedSearches() {
      const u = await getUser(); if (!u) return [];
      const { data } = await sb.from('saved_searches').select('*')
        .eq('user_id', u.id).order('created_at', { ascending: false });
      return data || [];
    },
    async deleteSavedSearch(id) {
      const { error } = await sb.from('saved_searches').delete().eq('id', id);
      if (error) throw error;
    },
    async toggleSearchAlert(id, alertEnabled) {
      const { error } = await sb.from('saved_searches').update({ alert: alertEnabled }).eq('id', id);
      if (error) throw error;
    },

    // ============================================================
    // 企業レビュー
    // ============================================================
    async postReview(companyId, { rating, title, body, isAnonymous = true }) {
      const u = await getUser(); if (!u) throw new Error('ログインが必要です');
      const { data, error } = await sb.from('reviews').upsert({
        company_id: companyId, author_id: u.id,
        rating, title: title || null, body, is_anonymous: isAnonymous,
      }, { onConflict: 'company_id,author_id' }).select().single();
      if (error) throw error;
      return data;
    },
    async listReviews(companyId) {
      const { data } = await sb.from('reviews').select('*')
        .eq('company_id', companyId).eq('is_hidden', false)
        .order('created_at', { ascending: false });
      return data || [];
    },
    async deleteReview(id) {
      const { error } = await sb.from('reviews').delete().eq('id', id);
      if (error) throw error;
    },
    async getCompanyStats(companyId) {
      const { data } = await sb.from('company_stats').select('*')
        .eq('company_id', companyId).maybeSingle();
      return data || { follower_count: 0, avg_rating: 0, review_count: 0 };
    },

    // ============================================================
    // イベント / セミナー
    // ============================================================
    async createEvent(companyId, input) {
      const { data, error } = await sb.from('events').insert({
        company_id: companyId, ...input,
      }).select().single();
      if (error) throw error;
      return data;
    },
    async listEvents({ upcoming = true, companyId = null, limit = 30 } = {}) {
      let q = sb.from('events').select('*, companies(name, logo_url)')
        .eq('is_published', true);
      if (companyId) q = q.eq('company_id', companyId);
      if (upcoming) q = q.gte('starts_at', new Date().toISOString());
      q = q.order('starts_at', { ascending: true }).limit(limit);
      const { data } = await q;
      return data || [];
    },
    async getEvent(id) {
      const { data } = await sb.from('events').select('*, companies(name, logo_url, id)')
        .eq('id', id).maybeSingle();
      return data;
    },
    async rsvp(eventId, status = 'going') {
      const u = await getUser(); if (!u) throw new Error('ログインが必要です');
      const { error } = await sb.from('event_rsvps').upsert({
        event_id: eventId, user_id: u.id, status,
      }, { onConflict: 'event_id,user_id' });
      if (error) throw error;
    },
    async myRsvp(eventId) {
      const u = await getUser(); if (!u) return null;
      const { data } = await sb.from('event_rsvps').select('status')
        .match({ event_id: eventId, user_id: u.id }).maybeSingle();
      return data?.status || null;
    },
    async countRsvps(eventId) {
      const { count } = await sb.from('event_rsvps')
        .select('id', { count: 'exact', head: true })
        .match({ event_id: eventId, status: 'going' });
      return count || 0;
    },

    // ============================================================
    // スキル推薦 (endorsements)
    // ============================================================
    async endorse(targetId, skill) {
      const u = await getUser(); if (!u) throw new Error('ログインが必要です');
      const { error } = await sb.from('endorsements').insert({
        endorser_id: u.id, target_id: targetId, skill,
      });
      if (error && error.code !== '23505') throw error;
    },
    async listEndorsements(targetId) {
      const { data } = await sb.from('endorsements').select('skill, endorser_id')
        .eq('target_id', targetId);
      return data || [];
    },

    // ============================================================
    // 通報
    // ============================================================
    async report(targetType, targetId, reason, detail) {
      const u = await getUser(); if (!u) throw new Error('ログインが必要です');
      const { error } = await sb.from('reports').insert({
        reporter_id: u.id, target_type: targetType, target_id: targetId,
        reason, detail: detail || null,
      });
      if (error) throw error;
    },
    async listReports(status = 'open') {
      const { data } = await sb.from('reports').select('*')
        .eq('status', status).order('created_at', { ascending: false });
      return data || [];
    },
    async resolveReport(id, newStatus = 'resolved') {
      const u = await getUser();
      const { error } = await sb.from('reports').update({
        status: newStatus, handled_by: u?.id || null,
      }).eq('id', id);
      if (error) throw error;
    },

    // ============================================================
    // ユーザー設定 (通知/プライバシー/ブロック)
    // ============================================================
    async getSettings() {
      const u = await getUser(); if (!u) return null;
      const { data } = await sb.from('user_settings').select('*').eq('user_id', u.id).maybeSingle();
      if (data) return data;
      // 未作成なら作る
      const { data: created } = await sb.from('user_settings').insert({ user_id: u.id }).select().single();
      return created;
    },
    async updateSettings(patch) {
      const u = await getUser(); if (!u) throw new Error('ログインが必要です');
      await this.getSettings(); // 無ければ作る
      const { error } = await sb.from('user_settings').update(patch).eq('user_id', u.id);
      if (error) throw error;
    },
    async blockUser(targetUserId) {
      const s = await this.getSettings();
      const next = Array.from(new Set([...(s.blocked_users || []), targetUserId]));
      await this.updateSettings({ blocked_users: next });
    },
    async unblockUser(targetUserId) {
      const s = await this.getSettings();
      const next = (s.blocked_users || []).filter(id => id !== targetUserId);
      await this.updateSettings({ blocked_users: next });
    },

    // ============================================================
    // 企業お知らせ投稿 (company updates)
    // ============================================================
    async postCompanyUpdate(companyId, { title, body }) {
      const { data, error } = await sb.from('company_updates').insert({
        company_id: companyId, title, body,
      }).select().single();
      if (error) throw error;
      return data;
    },
    async listCompanyUpdates(companyId, limit = 20) {
      const { data } = await sb.from('company_updates').select('*')
        .eq('company_id', companyId).order('created_at', { ascending: false }).limit(limit);
      return data || [];
    },

    // ============================================================
    // セマンティック検索 / レコメンド (pgvector)
    // ============================================================
    async semanticSearchJobs(queryEmbedding, { threshold = 0.7, count = 10 } = {}) {
      const { data, error } = await sb.rpc('match_jobs', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: count,
      });
      if (error) throw error;
      return data || [];
    },
    async recommendJobs({ count = 10 } = {}) {
      const u = await getUser(); if (!u) return [];
      const { data, error } = await sb.rpc('recommend_jobs', {
        for_user: u.id, match_count: count,
      });
      if (error) { console.warn('recommend_jobs failed:', error); return []; }
      return data || [];
    },

    // ============================================================
    // 検索履歴
    // ============================================================
    async logSearch(query) {
      const u = await getUser(); if (!u) return;
      await sb.from('search_history').insert({ user_id: u.id, query }).throwOnError?.();
    },
    async recentSearches(limit = 10) {
      const u = await getUser(); if (!u) return [];
      const { data } = await sb.from('search_history').select('query, created_at')
        .eq('user_id', u.id).order('created_at', { ascending: false }).limit(limit);
      return data || [];
    },

    // ============================================================
    // 通知 Realtime (グローバルトースト用)
    // ============================================================
    subscribeMyNotifications(handler) {
      // getUserは async なので外で呼んでユーザー確認する前提
      return sb.channel('my-notifs')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
        }, (payload) => handler(payload.new))
        .subscribe();
    },

    // ============================================================
    // OAuth ログイン
    // ============================================================
    async signInWithOAuth(provider /* 'google' | 'linkedin' | 'github' */) {
      const { error } = await sb.auth.signInWithOAuth({
        provider,
        options: { redirectTo: location.origin + '/login.html' },
      });
      if (error) throw error;
    },
    async signInWithMagicLink(email) {
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: location.origin + '/mypage.html' },
      });
      if (error) throw error;
    },
  };
})();
