-- ============================================================================
-- AIme スキーマ v2: 求人プラットフォーム本格運用版
-- schema.sql の後に実行してください
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ロール管理: 学生 / 企業 / 管理者
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('student', 'company', 'admin');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists role public.user_role not null default 'student';

-- ---------------------------------------------------------------------------
-- 企業プロフィール
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  industry text,
  location text,
  website text,
  description text,
  logo_url text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);
create index if not exists companies_owner_idx on public.companies(owner_id);

-- ---------------------------------------------------------------------------
-- DB駆動の求人 (静的JOBS_DATAの代替)
-- ---------------------------------------------------------------------------
create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  description text,
  salary_min int,
  salary_max int,
  location text,
  category text,
  tags text[] default '{}',
  workdays text,
  skills text[] default '{}',
  welcome_skills text[] default '{}',
  benefits text[] default '{}',
  deadline timestamptz,
  is_public boolean not null default true,
  status text not null default 'pending' check (status in ('pending','approved','rejected','closed')),
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists job_postings_company_idx on public.job_postings(company_id);
create index if not exists job_postings_status_idx on public.job_postings(status);
create index if not exists job_postings_public_idx on public.job_postings(is_public, status);
create index if not exists job_postings_deadline_idx on public.job_postings(deadline);
-- 全文検索用
create index if not exists job_postings_search_idx on public.job_postings
  using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,'')));

-- 期限超過で自動クローズするトリガー（即時・読み込み時に判定）
create or replace function public.maybe_close_expired_job()
returns trigger as $$
begin
  if new.deadline is not null and new.deadline < now() and new.status <> 'closed' then
    new.status := 'closed';
  end if;
  return new;
end;
$$ language plpgsql;
drop trigger if exists trg_close_expired_job on public.job_postings;
create trigger trg_close_expired_job
  before insert or update on public.job_postings
  for each row execute function public.maybe_close_expired_job();

-- ---------------------------------------------------------------------------
-- 応募 (既存テーブルを拡張) - 履歴書URL・DB求人参照を追加
-- ---------------------------------------------------------------------------
alter table public.applications add column if not exists resume_url text;
alter table public.applications add column if not exists db_job_id uuid references public.job_postings(id) on delete set null;
alter table public.applications add column if not exists note text;

-- ---------------------------------------------------------------------------
-- 会話 & メッセージ (チャット)
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  job_posting_id uuid references public.job_postings(id) on delete set null,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (student_id, company_id)
);
create index if not exists conv_student_idx on public.conversations(student_id, last_message_at desc);
create index if not exists conv_company_idx on public.conversations(company_id, last_message_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text,
  attachment_url text,
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages(conversation_id, created_at);

-- last_message_at 自動更新
create or replace function public.bump_conversation_last_message()
returns trigger as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$ language plpgsql;
drop trigger if exists trg_bump_conv on public.messages;
create trigger trg_bump_conv
  after insert on public.messages
  for each row execute function public.bump_conversation_last_message();

-- ---------------------------------------------------------------------------
-- 通知
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('application','message','result','system','post','comment')),
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notif_user_idx on public.notifications(user_id, is_read, created_at desc);

-- ---------------------------------------------------------------------------
-- アクセスログ (分析用)
-- ---------------------------------------------------------------------------
create table if not exists public.access_logs (
  id bigserial primary key,
  user_id uuid,
  page text,
  ref text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists access_logs_page_idx on public.access_logs(page, created_at desc);

-- ---------------------------------------------------------------------------
-- 通報 (モデレーション)
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  target_type text not null check (target_type in ('post','comment','user','job','company')),
  target_id text not null,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 閲覧履歴 (ユーザー行動)
-- ---------------------------------------------------------------------------
create table if not exists public.browse_history (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id text not null,
  viewed_at timestamptz not null default now()
);
create index if not exists browse_history_user_idx on public.browse_history(user_id, viewed_at desc);

-- ---------------------------------------------------------------------------
-- ファイル メタデータ (Storage のレコード)
-- ---------------------------------------------------------------------------
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('resume','portfolio','logo','other')),
  url text not null,
  original_name text,
  size_bytes int,
  created_at timestamptz not null default now()
);
create index if not exists files_user_idx on public.files(user_id, kind);

-- ---------------------------------------------------------------------------
-- Storage バケット (ログイン UI からアップできるよう設定)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('resumes', 'resumes', false),
         ('portfolios', 'portfolios', false),
         ('logos', 'logos', true)
  on conflict (id) do nothing;

-- Storage Policies
-- resumes/portfolios: 本人のみ読み書き
drop policy if exists "resumes_rw_own" on storage.objects;
create policy "resumes_rw_own" on storage.objects for all
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "portfolios_rw_own" on storage.objects;
create policy "portfolios_rw_own" on storage.objects for all
  using (bucket_id = 'portfolios' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'portfolios' and auth.uid()::text = (storage.foldername(name))[1]);
-- logos: 企業オーナーが自社ディレクトリに書き込み、読み取りは公開
drop policy if exists "logos_read_all" on storage.objects;
create policy "logos_read_all" on storage.objects for select using (bucket_id = 'logos');
drop policy if exists "logos_write_own" on storage.objects;
create policy "logos_write_own" on storage.objects for insert with check (
  bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]
);
drop policy if exists "logos_update_own" on storage.objects;
create policy "logos_update_own" on storage.objects for update using (
  bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]
);
drop policy if exists "logos_delete_own" on storage.objects;
create policy "logos_delete_own" on storage.objects for delete using (
  bucket_id = 'logos' and auth.uid()::text = (storage.foldername(name))[1]
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.companies       enable row level security;
alter table public.job_postings    enable row level security;
alter table public.conversations   enable row level security;
alter table public.messages        enable row level security;
alter table public.notifications   enable row level security;
alter table public.access_logs     enable row level security;
alter table public.reports         enable row level security;
alter table public.browse_history  enable row level security;
alter table public.files           enable row level security;

-- companies
drop policy if exists "companies_select_all" on public.companies;
create policy "companies_select_all" on public.companies for select using (true);
drop policy if exists "companies_insert_own" on public.companies;
create policy "companies_insert_own" on public.companies for insert with check (auth.uid() = owner_id);
drop policy if exists "companies_update_own" on public.companies;
create policy "companies_update_own" on public.companies for update using (auth.uid() = owner_id);
drop policy if exists "companies_delete_own" on public.companies;
create policy "companies_delete_own" on public.companies for delete using (auth.uid() = owner_id);

-- job_postings: 公開＋承認済みは誰でも閲覧、企業オーナーは自社求人を全操作
drop policy if exists "jobs_select_public" on public.job_postings;
create policy "jobs_select_public" on public.job_postings for select using (
  (is_public = true and status = 'approved')
  or exists (select 1 from public.companies c where c.id = job_postings.company_id and c.owner_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
drop policy if exists "jobs_insert_company" on public.job_postings;
create policy "jobs_insert_company" on public.job_postings for insert with check (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
);
drop policy if exists "jobs_update_company" on public.job_postings;
create policy "jobs_update_company" on public.job_postings for update using (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
drop policy if exists "jobs_delete_company" on public.job_postings;
create policy "jobs_delete_company" on public.job_postings for delete using (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
);

-- conversations & messages: 当事者のみ
drop policy if exists "conv_rw_participant" on public.conversations;
create policy "conv_rw_participant" on public.conversations for all using (
  auth.uid() = student_id
  or exists (select 1 from public.companies c where c.id = conversations.company_id and c.owner_id = auth.uid())
) with check (
  auth.uid() = student_id
  or exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
);

drop policy if exists "msg_rw_participant" on public.messages;
create policy "msg_rw_participant" on public.messages for all using (
  exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (c.student_id = auth.uid()
           or exists (select 1 from public.companies x where x.id = c.company_id and x.owner_id = auth.uid()))
  )
) with check (
  sender_id = auth.uid() and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.student_id = auth.uid()
           or exists (select 1 from public.companies x where x.id = c.company_id and x.owner_id = auth.uid()))
  )
);

-- notifications: 本人のみ
drop policy if exists "notif_own" on public.notifications;
create policy "notif_own" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- access_logs: 自分のログのみ insert、admin は全閲覧
drop policy if exists "logs_insert_self" on public.access_logs;
create policy "logs_insert_self" on public.access_logs for insert with check (user_id = auth.uid() or user_id is null);
drop policy if exists "logs_admin_select" on public.access_logs;
create policy "logs_admin_select" on public.access_logs for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- reports: 誰でも投稿可、閲覧はadminのみ
drop policy if exists "reports_insert_any" on public.reports;
create policy "reports_insert_any" on public.reports for insert with check (true);
drop policy if exists "reports_admin_all" on public.reports;
create policy "reports_admin_all" on public.reports for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
drop policy if exists "reports_admin_update" on public.reports;
create policy "reports_admin_update" on public.reports for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- browse_history: 本人のみ
drop policy if exists "bh_own" on public.browse_history;
create policy "bh_own" on public.browse_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- files: 本人のみ
drop policy if exists "files_own" on public.files;
create policy "files_own" on public.files for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 応募時に自動通知 (企業向け)
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_application()
returns trigger as $$
declare owner uuid;
begin
  -- db_job_id があればその企業オーナーに通知
  if new.db_job_id is not null then
    select c.owner_id into owner
    from public.job_postings jp
    join public.companies c on c.id = jp.company_id
    where jp.id = new.db_job_id;
    if owner is not null then
      insert into public.notifications (user_id, kind, title, body, link)
      values (owner, 'application', '新しい応募', coalesce(new.job_title, '') || ' に応募がありました', '/company-dashboard.html');
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists trg_notify_application on public.applications;
create trigger trg_notify_application
  after insert on public.applications
  for each row execute function public.notify_on_application();

-- ---------------------------------------------------------------------------
-- メッセージ受信時に通知
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_message()
returns trigger as $$
declare target uuid; other uuid;
begin
  select case when c.student_id = new.sender_id then (select owner_id from public.companies where id = c.company_id)
              else c.student_id end
    into target
    from public.conversations c where c.id = new.conversation_id;
  if target is not null and target <> new.sender_id then
    insert into public.notifications (user_id, kind, title, body, link)
    values (target, 'message', '新しいメッセージ', left(coalesce(new.body, '(添付)'), 60), '/messages.html?cid=' || new.conversation_id::text);
  end if;
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists trg_notify_message on public.messages;
create trigger trg_notify_message
  after insert on public.messages
  for each row execute function public.notify_on_message();

-- ---------------------------------------------------------------------------
-- 応募ステータス更新時に学生へ通知 (合否含む)
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_status_change()
returns trigger as $$
begin
  if old.status <> new.status then
    insert into public.notifications (user_id, kind, title, body, link)
    values (
      new.user_id, 'result', '応募ステータスが更新されました',
      coalesce(new.job_title,'') || ' : ' || new.status, '/mypage.html'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists trg_notify_status on public.applications;
create trigger trg_notify_status
  after update on public.applications
  for each row execute function public.notify_on_status_change();

-- ---------------------------------------------------------------------------
-- 応募者一覧を企業が取得するRPC (サーバー側でフィルタ)
-- ---------------------------------------------------------------------------
create or replace function public.get_company_applicants(p_company_id uuid)
returns table (
  app_id uuid, user_id uuid, job_id text, job_title text, status text, note text, created_at timestamptz,
  nickname text, school text
) as $$
  select a.id, a.user_id, a.job_id, a.job_title, a.status, a.note, a.created_at,
         p.nickname, p.school
  from public.applications a
  left join public.profiles p on p.id = a.user_id
  left join public.job_postings jp on jp.id = a.db_job_id
  where jp.company_id = p_company_id
     or exists (select 1 from public.companies c where c.id = p_company_id and c.owner_id = auth.uid() and a.job_company = c.name)
  order by a.created_at desc;
$$ language sql security definer;

-- ---------------------------------------------------------------------------
-- ランキング: 応募数カウント
-- ---------------------------------------------------------------------------
create or replace function public.top_jobs_by_applications(p_limit int default 10)
returns table (job_id text, applicant_count bigint) as $$
  select job_id, count(*) as applicant_count
  from public.applications
  group by job_id
  order by applicant_count desc
  limit p_limit;
$$ language sql stable;

-- ---------------------------------------------------------------------------
-- Realtime 有効化
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.job_postings;
alter publication supabase_realtime add table public.applications;

-- 完了
