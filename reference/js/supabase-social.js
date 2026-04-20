/* ==========================================================================
   supabase-social.js - いいね / ブックマーク / コメント / 投稿 / 応募管理
   前提: supabase-js + supabase-client.js が先に読み込まれていること
   ========================================================================== */
(function () {
  if (!window.sb) {
    console.warn('Supabase 未初期化');
    return;
  }
  const sb = window.sb;

  async function getUser() {
    const { data } = await sb.auth.getUser();
    return data?.user || null;
  }

  window.AImeSocial = {
    getUser,

    // -------- いいね --------
    async like(targetType, targetId) {
      const user = await getUser();
      if (!user) throw new Error('ログインが必要です');
      const { error } = await sb.from('likes').insert({
        user_id: user.id, target_type: targetType, target_id: targetId,
      });
      if (error && error.code !== '23505') throw error; // unique違反は無視
    },
    async unlike(targetType, targetId) {
      const user = await getUser();
      if (!user) throw new Error('ログインが必要です');
      const { error } = await sb.from('likes')
        .delete()
        .match({ user_id: user.id, target_type: targetType, target_id: targetId });
      if (error) throw error;
    },
    async hasLiked(targetType, targetId) {
      const user = await getUser();
      if (!user) return false;
      const { data } = await sb.from('likes').select('id')
        .match({ user_id: user.id, target_type: targetType, target_id: targetId })
        .limit(1).maybeSingle();
      return !!data;
    },
    async countLikes(targetType, targetId) {
      const { count } = await sb.from('likes')
        .select('id', { count: 'exact', head: true })
        .match({ target_type: targetType, target_id: targetId });
      return count || 0;
    },

    // -------- ブックマーク --------
    async bookmark(jobId, meta) {
      const user = await getUser();
      if (!user) throw new Error('ログインが必要です');
      const { error } = await sb.from('bookmarks').insert({
        user_id: user.id, job_id: jobId,
        job_company: meta?.company || null, job_title: meta?.title || null,
      });
      if (error && error.code !== '23505') throw error;
    },
    async unbookmark(jobId) {
      const user = await getUser();
      if (!user) throw new Error('ログインが必要です');
      const { error } = await sb.from('bookmarks').delete()
        .match({ user_id: user.id, job_id: jobId });
      if (error) throw error;
    },
    async isBookmarked(jobId) {
      const user = await getUser();
      if (!user) return false;
      const { data } = await sb.from('bookmarks').select('id')
        .match({ user_id: user.id, job_id: jobId }).limit(1).maybeSingle();
      return !!data;
    },
    async listBookmarks() {
      const user = await getUser();
      if (!user) return [];
      const { data } = await sb.from('bookmarks').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    },

    // -------- 応募 --------
    async apply(jobId, meta) {
      const user = await getUser();
      if (!user) throw new Error('ログインが必要です');
      const { error } = await sb.from('applications').insert({
        user_id: user.id, job_id: jobId,
        job_company: meta?.company || null, job_title: meta?.title || null,
        message: meta?.message || null,
      });
      if (error && error.code !== '23505') throw error;
    },
    async listApplications() {
      const user = await getUser();
      if (!user) return [];
      const { data } = await sb.from('applications').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false });
      return data || [];
    },

    // -------- コメント --------
    async addComment(targetType, targetId, body) {
      const user = await getUser();
      if (!user) throw new Error('ログインが必要です');
      const { data, error } = await sb.from('comments').insert({
        target_type: targetType, target_id: targetId,
        author_id: user.id, body,
      }).select().single();
      if (error) throw error;
      return data;
    },
    async listComments(targetType, targetId) {
      const { data } = await sb.from('comments')
        .select('*, profiles:author_id (nickname, avatar_color)')
        .match({ target_type: targetType, target_id: targetId })
        .order('created_at', { ascending: false });
      return data || [];
    },
    async deleteComment(commentId) {
      const { error } = await sb.from('comments').delete().eq('id', commentId);
      if (error) throw error;
    },

    // -------- 投稿（ブログ） --------
    async createPost({ title, body, tags }) {
      const user = await getUser();
      if (!user) throw new Error('ログインが必要です');
      const { data, error } = await sb.from('posts').insert({
        author_id: user.id, title, body, tags: tags || [],
      }).select().single();
      if (error) throw error;
      return data;
    },
    async listPosts({ limit = 30, orderByLikes = false } = {}) {
      if (orderByLikes) {
        // いいね数順: クライアント側で集計してソート（簡易版）
        const { data: posts } = await sb.from('posts')
          .select('*, profiles:author_id (nickname, avatar_color)')
          .order('created_at', { ascending: false }).limit(limit);
        if (!posts) return [];
        const ids = posts.map(p => p.id);
        if (ids.length === 0) return posts;
        const { data: likes } = await sb.from('likes')
          .select('target_id').eq('target_type', 'post').in('target_id', ids);
        const cnt = {};
        (likes || []).forEach(l => { cnt[l.target_id] = (cnt[l.target_id] || 0) + 1; });
        posts.forEach(p => p.like_count = cnt[p.id] || 0);
        posts.sort((a, b) => b.like_count - a.like_count);
        return posts;
      }
      const { data } = await sb.from('posts')
        .select('*, profiles:author_id (nickname, avatar_color)')
        .order('created_at', { ascending: false }).limit(limit);
      return data || [];
    },
    async getPost(id) {
      const { data } = await sb.from('posts')
        .select('*, profiles:author_id (nickname, avatar_color)')
        .eq('id', id).maybeSingle();
      return data;
    },
    async searchPosts(keyword, { limit = 30 } = {}) {
      // 全文検索の簡易版: title/body に対する ILIKE
      const { data } = await sb.from('posts')
        .select('*, profiles:author_id (nickname, avatar_color)')
        .or(`title.ilike.%${keyword}%,body.ilike.%${keyword}%`)
        .order('created_at', { ascending: false }).limit(limit);
      return data || [];
    },

    // -------- 求人統計 (ランキング) --------
    async incrementJobView(jobId) {
      await sb.rpc('increment_job_view', { p_job_id: jobId });
    },
    async topJobsByViews(limit = 10) {
      const { data } = await sb.from('job_stats')
        .select('*').order('view_count', { ascending: false }).limit(limit);
      return data || [];
    },

    // -------- プロフィール --------
    async getProfile(userId) {
      if (!userId) { const u = await getUser(); if (!u) return null; userId = u.id; }
      const { data } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
      return data;
    },
    async updateProfile(patch) {
      const user = await getUser();
      if (!user) throw new Error('ログインが必要です');
      const { error } = await sb.from('profiles').update(patch).eq('id', user.id);
      if (error) throw error;
    },

    // -------- Realtime: 対象ターゲットのいいね/コメント変化を購読 --------
    subscribeTargetUpdates(targetType, targetId, handler) {
      return sb.channel('target-' + targetType + '-' + targetId)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'likes',
          filter: `target_type=eq.${targetType}`,
        }, (payload) => {
          const row = payload.new || payload.old;
          if (row && row.target_id === targetId) handler({ kind: 'likes', event: payload.eventType, row });
        })
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'comments',
          filter: `target_type=eq.${targetType}`,
        }, (payload) => {
          const row = payload.new || payload.old;
          if (row && row.target_id === targetId) handler({ kind: 'comments', event: payload.eventType, row });
        })
        .subscribe();
    },

    // -------- Realtime: 新着投稿を購読 --------
    subscribeNewPosts(handler) {
      return sb.channel('posts-new')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'posts',
        }, (payload) => handler(payload.new))
        .subscribe();
    },
  };
})();
