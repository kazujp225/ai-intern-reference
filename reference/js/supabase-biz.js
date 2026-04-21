/* ==========================================================================
   supabase-biz.js - 企業・求人・メッセージ・通知・ファイル・管理者API
   ========================================================================== */
(function () {
  if (!window.sb) return;
  const sb = window.sb;

  async function getUser() {
    const { data } = await sb.auth.getUser();
    return data?.user || null;
  }
  async function getRole() {
    const u = await getUser();
    if (!u) return null;
    const { data } = await sb.from('profiles').select('role').eq('id', u.id).maybeSingle();
    return data?.role || 'student';
  }

  window.AImeBiz = {
    getUser,
    getRole,

    // ---- Auth 拡張 ----
    async signInWithGoogle() {
      return await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: location.origin + '/original.html' },
      });
    },
    async sendPasswordReset(email) {
      return await sb.auth.resetPasswordForEmail(email, {
        redirectTo: location.origin + '/reset-password.html',
      });
    },
    async updatePassword(newPassword) {
      return await sb.auth.updateUser({ password: newPassword });
    },

    // ---- 企業 ----
    async createCompany(input) {
      const u = await getUser(); if (!u) throw new Error('ログインが必要です');
      const { data, error } = await sb.from('companies').insert({
        owner_id: u.id, ...input,
      }).select().single();
      if (error) throw error;
      // profile.role -> company
      await sb.from('profiles').update({ role: 'company' }).eq('id', u.id);
      return data;
    },
    async getMyCompany() {
      const u = await getUser(); if (!u) return null;
      const { data } = await sb.from('companies').select('*').eq('owner_id', u.id).maybeSingle();
      return data;
    },
    async updateCompany(patch) {
      const u = await getUser(); if (!u) throw new Error('ログインが必要です');
      const { error } = await sb.from('companies').update(patch).eq('owner_id', u.id);
      if (error) throw error;
    },
    async listCompanies() {
      const { data } = await sb.from('companies').select('*').eq('is_approved', true).order('created_at', { ascending: false });
      return data || [];
    },
    async getCompanyById(id) {
      const { data } = await sb.from('companies').select('*').eq('id', id).maybeSingle();
      return data;
    },
    async listCompaniesWithStats({ limit = 50, offset = 0, keyword, category } = {}) {
      let q = sb.from('companies').select('*, job_postings(count)', { count: 'exact' })
        .eq('is_approved', true);
      if (keyword) q = q.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);
      if (category) q = q.eq('industry', category);
      q = q.order('is_verified', { ascending: false }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      const { data, count } = await q;
      return { items: data || [], total: count || 0 };
    },
    async countJobsByCompany(companyId) {
      const { count } = await sb.from('job_postings').select('id', { count: 'exact', head: true })
        .eq('company_id', companyId).eq('is_public', true).eq('status', 'approved');
      return count || 0;
    },

    // ---- DB駆動の求人 ----
    async createJob(input) {
      const c = await this.getMyCompany();
      if (!c) throw new Error('先に企業登録してください');
      const { data, error } = await sb.from('job_postings').insert({
        company_id: c.id, ...input,
      }).select().single();
      if (error) throw error;
      return data;
    },
    async updateJob(jobId, patch) {
      const { error } = await sb.from('job_postings').update(patch).eq('id', jobId);
      if (error) throw error;
    },
    async deleteJob(jobId) {
      const { error } = await sb.from('job_postings').delete().eq('id', jobId);
      if (error) throw error;
    },
    async listMyJobs() {
      const c = await this.getMyCompany(); if (!c) return [];
      const { data } = await sb.from('job_postings').select('*').eq('company_id', c.id).order('created_at', { ascending: false });
      return data || [];
    },
    async listPublicJobs({ limit = 30, offset = 0, keyword, category, location, tag, feature, companyId, remoteType, sort = 'new' } = {}) {
      let q = sb.from('job_postings').select('*, companies(id, name, logo_url, industry, is_verified)', { count: 'exact' })
        .eq('is_public', true).eq('status', 'approved').eq('is_draft', false);
      if (keyword) q = q.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
      if (category) q = q.eq('category', category);
      if (location) q = q.ilike('location', `%${location}%`);
      if (companyId) q = q.eq('company_id', companyId);
      if (remoteType) q = q.eq('remote_type', remoteType);
      if (tag)     q = q.contains('tags', [tag]);
      if (feature) q = q.contains('tags', [feature]);
      if (sort === 'new')      q = q.order('is_boosted', { ascending: false }).order('created_at', { ascending: false });
      if (sort === 'popular')  q = q.order('is_boosted', { ascending: false }).order('view_count', { ascending: false });
      if (sort === 'deadline') q = q.order('deadline', { ascending: true, nullsLast: true });
      q = q.range(offset, offset + limit - 1);
      const { data, count } = await q;
      return { items: data || [], total: count || 0 };
    },
    async listFeaturedJobs(limit = 8) {
      const { data } = await sb.from('job_postings').select('*, companies(id, name, logo_url)')
        .eq('is_public', true).eq('status', 'approved').eq('is_draft', false)
        .eq('is_boosted', true).order('created_at', { ascending: false }).limit(limit);
      return data || [];
    },
    async listTopCompanies(limit = 12) {
      const { data } = await sb.from('companies').select('*')
        .eq('is_approved', true).order('is_verified', { ascending: false })
        .order('created_at', { ascending: false }).limit(limit);
      return data || [];
    },
    async getJob(jobId) {
      const { data } = await sb.from('job_postings').select('*, companies(*)').eq('id', jobId).maybeSingle();
      return data;
    },
    async incrementJobPostingView(jobId) {
      await sb.rpc('increment_job_view', { p_job_id: jobId });
    },

    // ---- 応募 ----
    async apply({ jobId, dbJobId, company, title, message, resumeUrl }) {
      const u = await getUser(); if (!u) throw new Error('ログインが必要です');
      const { error } = await sb.from('applications').insert({
        user_id: u.id, job_id: jobId, db_job_id: dbJobId || null,
        job_company: company, job_title: title, message: message || null, resume_url: resumeUrl || null,
      });
      if (error && error.code !== '23505') throw error;
    },
    async updateApplicationStatus(appId, status) {
      const { error } = await sb.from('applications').update({ status }).eq('id', appId);
      if (error) throw error;
    },
    async getCompanyApplicants() {
      const c = await this.getMyCompany(); if (!c) return [];
      const { data } = await sb.rpc('get_company_applicants', { p_company_id: c.id });
      return data || [];
    },

    // ---- メッセージ ----
    async getOrCreateConversation({ companyId, jobPostingId }) {
      const u = await getUser(); if (!u) throw new Error('ログインが必要です');
      const { data: existing } = await sb.from('conversations')
        .select('*').match({ student_id: u.id, company_id: companyId }).maybeSingle();
      if (existing) return existing;
      const { data, error } = await sb.from('conversations').insert({
        student_id: u.id, company_id: companyId, job_posting_id: jobPostingId || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    async listConversations() {
      const u = await getUser(); if (!u) return [];
      const role = await getRole();
      let q;
      if (role === 'company') {
        const c = await this.getMyCompany(); if (!c) return [];
        q = sb.from('conversations').select('*, profiles:student_id(nickname)').eq('company_id', c.id);
      } else {
        q = sb.from('conversations').select('*, companies(name, logo_url)').eq('student_id', u.id);
      }
      const { data } = await q.order('last_message_at', { ascending: false });
      return data || [];
    },
    async listMessages(conversationId) {
      const { data } = await sb.from('messages').select('*').eq('conversation_id', conversationId).order('created_at');
      return data || [];
    },
    async sendMessage(conversationId, body, attachmentUrl) {
      const u = await getUser(); if (!u) throw new Error('ログインが必要です');
      const { error } = await sb.from('messages').insert({
        conversation_id: conversationId, sender_id: u.id, body, attachment_url: attachmentUrl || null,
      });
      if (error) throw error;
    },
    subscribeMessages(conversationId, handler) {
      return sb.channel('msg-' + conversationId)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: 'conversation_id=eq.' + conversationId,
        }, (payload) => handler(payload.new))
        .subscribe();
    },

    // ---- 通知 ----
    async listNotifications({ unreadOnly = false, limit = 30 } = {}) {
      const u = await getUser(); if (!u) return [];
      let q = sb.from('notifications').select('*').eq('user_id', u.id);
      if (unreadOnly) q = q.eq('is_read', false);
      q = q.order('created_at', { ascending: false }).limit(limit);
      const { data } = await q;
      return data || [];
    },
    async markNotificationRead(notifId) {
      await sb.from('notifications').update({ is_read: true }).eq('id', notifId);
    },
    async markAllNotificationsRead() {
      const u = await getUser(); if (!u) return;
      await sb.from('notifications').update({ is_read: true }).eq('user_id', u.id).eq('is_read', false);
    },
    subscribeNotifications(userId, handler) {
      return sb.channel('notif-' + userId)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: 'user_id=eq.' + userId,
        }, (payload) => handler(payload.new))
        .subscribe();
    },

    // ---- 閲覧履歴 ----
    async recordBrowseHistory(jobId) {
      const u = await getUser(); if (!u) return;
      await sb.from('browse_history').insert({ user_id: u.id, job_id: jobId });
    },
    async listBrowseHistory(limit = 30) {
      const u = await getUser(); if (!u) return [];
      const { data } = await sb.from('browse_history').select('*').eq('user_id', u.id)
        .order('viewed_at', { ascending: false }).limit(limit);
      return data || [];
    },

    // ---- アクセスログ ----
    async logAccess(page, ref) {
      const u = await getUser();
      await sb.from('access_logs').insert({
        user_id: u?.id || null, page, ref: ref || document.referrer || null,
        user_agent: navigator.userAgent.slice(0, 200),
      });
    },

    // ---- 通報 ----
    async reportItem({ targetType, targetId, reason }) {
      const u = await getUser();
      await sb.from('reports').insert({
        reporter_id: u?.id || null, target_type: targetType, target_id: targetId, reason,
      });
    },

    // ---- 管理者 ----
    async adminListReports() {
      const { data } = await sb.from('reports').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    async adminUpdateReport(id, status) {
      await sb.from('reports').update({ status }).eq('id', id);
    },
    async adminListUsers() {
      const { data } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
      return data || [];
    },
    async adminSetRole(userId, role) {
      await sb.from('profiles').update({ role }).eq('id', userId);
    },
    async adminListPendingJobs() {
      const { data } = await sb.from('job_postings').select('*, companies(name)').eq('status', 'pending')
        .order('created_at', { ascending: false });
      return data || [];
    },
    async adminApproveJob(id) {
      await sb.from('job_postings').update({ status: 'approved' }).eq('id', id);
    },
    async adminRejectJob(id) {
      await sb.from('job_postings').update({ status: 'rejected' }).eq('id', id);
    },
    async adminApproveCompany(id) {
      await sb.from('companies').update({ is_approved: true }).eq('id', id);
    },
    async adminAnalytics() {
      const [{ count: userCount }, { count: jobCount }, { count: appCount }] = await Promise.all([
        sb.from('profiles').select('id', { count: 'exact', head: true }),
        sb.from('job_postings').select('id', { count: 'exact', head: true }),
        sb.from('applications').select('id', { count: 'exact', head: true }),
      ]);
      return { userCount: userCount || 0, jobCount: jobCount || 0, appCount: appCount || 0 };
    },

    // ---- ストレージ (ファイル) ----
    async uploadFile(bucket, file, kind) {
      const u = await getUser(); if (!u) throw new Error('ログインが必要です');
      const ext = file.name.split('.').pop();
      const path = `${u.id}/${Date.now()}.${ext}`;
      const { error } = await sb.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      let url;
      if (bucket === 'logos') {
        const { data } = sb.storage.from(bucket).getPublicUrl(path);
        url = data.publicUrl;
      } else {
        const { data } = await sb.storage.from(bucket).createSignedUrl(path, 3600 * 24 * 7);
        url = data?.signedUrl;
      }
      await sb.from('files').insert({ user_id: u.id, kind, url, original_name: file.name, size_bytes: file.size });
      return { path, url };
    },
    async listFiles(kind) {
      const u = await getUser(); if (!u) return [];
      let q = sb.from('files').select('*').eq('user_id', u.id);
      if (kind) q = q.eq('kind', kind);
      q = q.order('created_at', { ascending: false });
      const { data } = await q;
      return data || [];
    },
  };
})();
