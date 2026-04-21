-- ============================================================================
-- AIme Schema v3 — 全機能スキーマ
-- Supabase Dashboard → SQL Editor で実行してください (schema.sql / schema-v2.sql の後)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. 拡張 (extensions)
-- ---------------------------------------------------------------------------
create extension if not exists pg_trgm;        -- あいまい検索
create extension if not exists unaccent;       -- 全角/半角吸収
create extension if not exists vector;         -- pgvector (AI埋め込み)
create extension if not exists pg_cron;        -- スケジュール実行

-- ---------------------------------------------------------------------------
-- 1. profiles 拡張カラム
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists cover_url  text;
alter table public.profiles add column if not exists bio        text;
alter table public.profiles add column if not exists skills     text[] default '{}';
alter table public.profiles add column if not exists location   text;
alter table public.profiles add column if not exists portfolio_url text;
alter table public.profiles add column if not exists github_url    text;
alter table public.profiles add column if not exists linkedin_url  text;
alter table public.profiles add column if not exists role       text default 'student'; -- student|company|admin
alter table public.profiles add column if not exists is_blocked boolean not null default false;
alter table public.profiles add column if not exists privacy    jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists embedding  vector(1536); -- プロフィール埋め込み

-- ---------------------------------------------------------------------------
-- 2. companies 拡張カラム
-- ---------------------------------------------------------------------------
alter table public.companies add column if not exists cover_url   text;
alter table public.companies add column if not exists is_verified boolean not null default false;
alter table public.companies add column if not exists plan        text default 'free'; -- free|pro|enterprise
alter table public.companies add column if not exists stripe_customer_id text;
alter table public.companies add column if not exists embedding   vector(1536);

-- ---------------------------------------------------------------------------
-- 3. job_postings 拡張カラム
-- ---------------------------------------------------------------------------
alter table public.job_postings add column if not exists deadline    timestamptz;
alter table public.job_postings add column if not exists is_boosted  boolean not null default false;
alter table public.job_postings add column if not exists is_draft    boolean not null default false;
alter table public.job_postings add column if not exists remote_type text default 'onsite'; -- onsite|hybrid|remote
alter table public.job_postings add column if not exists embedding   vector(1536);

-- ---------------------------------------------------------------------------
-- 4. follows (学生 <-> 企業 / 学生 <-> 学生)
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null, -- 'company' | 'user'
  target_id   uuid not null,
  created_at  timestamptz not null default now(),
  unique (follower_id, target_type, target_id)
);
create index if not exists follows_follower_idx on public.follows(follower_id);
create index if not exists follows_target_idx   on public.follows(target_type, target_id);

-- ---------------------------------------------------------------------------
-- 5. saved_searches (条件保存 + 新着通知)
-- ---------------------------------------------------------------------------
create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  label      text not null,
  params     jsonb not null, -- { q, tag, area, feature, job_cat, ... }
  alert      boolean not null default true,
  last_checked_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists saved_searches_user_idx on public.saved_searches(user_id);

-- ---------------------------------------------------------------------------
-- 6. reviews (企業レビュー)
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  rating     int  not null check (rating between 1 and 5),
  title      text,
  body       text not null,
  is_anonymous boolean not null default true,
  is_hidden  boolean not null default false,
  created_at timestamptz not null default now(),
  unique (company_id, author_id)
);
create index if not exists reviews_company_idx on public.reviews(company_id);

-- ---------------------------------------------------------------------------
-- 7. events (企業主催イベント / セミナー)
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title      text not null,
  description text,
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  location   text,
  online_url text,
  capacity   int,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists events_starts_idx on public.events(starts_at);

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id  uuid not null references auth.users(id)   on delete cascade,
  status   text not null default 'going', -- going|maybe|not_going
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
create index if not exists event_rsvps_event_idx on public.event_rsvps(event_id);

-- ---------------------------------------------------------------------------
-- 8. endorsements (スキル推薦)
-- ---------------------------------------------------------------------------
create table if not exists public.endorsements (
  id uuid primary key default gen_random_uuid(),
  endorser_id uuid not null references auth.users(id) on delete cascade,
  target_id   uuid not null references auth.users(id) on delete cascade,
  skill       text not null,
  created_at  timestamptz not null default now(),
  unique (endorser_id, target_id, skill)
);
create index if not exists endorsements_target_idx on public.endorsements(target_id);

-- ---------------------------------------------------------------------------
-- 9. reports (通報)
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null, -- 'post' | 'comment' | 'message' | 'user' | 'job' | 'review'
  target_id   uuid not null,
  reason      text not null,
  detail      text,
  status      text not null default 'open', -- open|reviewing|resolved|dismissed
  handled_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);
create index if not exists reports_status_idx on public.reports(status);

-- ---------------------------------------------------------------------------
-- 10. audit_logs (重要操作)
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  action   text not null, -- 'delete_post' | 'ban_user' | 'approve_company' ...
  target_type text,
  target_id   uuid,
  metadata  jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- 11. user_settings (プライバシー / 通知設定)
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notify_email boolean not null default true,
  notify_push  boolean not null default true,
  digest_frequency text not null default 'weekly', -- off|daily|weekly
  show_profile_publicly boolean not null default true,
  show_contact_to_companies boolean not null default true,
  blocked_users uuid[] default '{}',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 12. company_updates (企業お知らせ投稿)
-- ---------------------------------------------------------------------------
create table if not exists public.company_updates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  body  text not null,
  created_at timestamptz not null default now()
);
create index if not exists company_updates_company_idx on public.company_updates(company_id);

-- ---------------------------------------------------------------------------
-- 13. search_history
-- ---------------------------------------------------------------------------
create table if not exists public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  created_at timestamptz not null default now()
);
create index if not exists search_history_user_idx on public.search_history(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 14. endorsements 拡張: posts / jobs へハッシュタグ
-- ---------------------------------------------------------------------------
-- posts は既に tags text[] を持っているので再利用。
-- 求人も tags を持つなら追加: ↓
alter table public.job_postings add column if not exists tags text[] default '{}';

-- ---------------------------------------------------------------------------
-- 15. インデックス (trigram / GIN)
-- ---------------------------------------------------------------------------
create index if not exists posts_title_trgm_idx on public.posts using gin (title gin_trgm_ops);
create index if not exists posts_body_trgm_idx  on public.posts using gin (body  gin_trgm_ops);
create index if not exists jobs_title_trgm_idx  on public.job_postings using gin (title gin_trgm_ops);
create index if not exists jobs_tags_gin_idx    on public.job_postings using gin (tags);
create index if not exists posts_tags_gin_idx   on public.posts using gin (tags);

-- pgvector インデックス (IVFFlat / HNSW が選べる; HNSW推奨)
create index if not exists profiles_embedding_idx on public.profiles using hnsw (embedding vector_cosine_ops);
create index if not exists companies_embedding_idx on public.companies using hnsw (embedding vector_cosine_ops);
create index if not exists jobs_embedding_idx      on public.job_postings using hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- 16. RLS ポリシー
-- ---------------------------------------------------------------------------
alter table public.follows          enable row level security;
alter table public.saved_searches   enable row level security;
alter table public.reviews          enable row level security;
alter table public.events           enable row level security;
alter table public.event_rsvps      enable row level security;
alter table public.endorsements     enable row level security;
alter table public.reports          enable row level security;
alter table public.audit_logs       enable row level security;
alter table public.user_settings    enable row level security;
alter table public.company_updates  enable row level security;
alter table public.search_history   enable row level security;

-- follows: 全員読める / 自分の follow だけ insert・delete
drop policy if exists follows_select_all on public.follows;
create policy follows_select_all on public.follows for select using (true);
drop policy if exists follows_insert_self on public.follows;
create policy follows_insert_self on public.follows for insert with check (auth.uid() = follower_id);
drop policy if exists follows_delete_self on public.follows;
create policy follows_delete_self on public.follows for delete using (auth.uid() = follower_id);

-- saved_searches: 本人のみ
drop policy if exists ss_own on public.saved_searches;
create policy ss_own on public.saved_searches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reviews: 全員読める / ログイン済みで insert / 自分のレビューだけ update・delete
drop policy if exists reviews_select_all on public.reviews;
create policy reviews_select_all on public.reviews for select using (not is_hidden);
drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews for insert with check (auth.uid() = author_id);
drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews for update using (auth.uid() = author_id);
drop policy if exists reviews_delete_own on public.reviews;
create policy reviews_delete_own on public.reviews for delete using (auth.uid() = author_id);

-- events: 公開イベントは誰でも読める / 自社のみ insert/update/delete
drop policy if exists events_select_pub on public.events;
create policy events_select_pub on public.events for select using (is_published or exists (select 1 from public.companies c where c.id = events.company_id and c.owner_id = auth.uid()));
drop policy if exists events_insert_owner on public.events;
create policy events_insert_owner on public.events for insert with check (exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid()));
drop policy if exists events_update_owner on public.events;
create policy events_update_owner on public.events for update using (exists (select 1 from public.companies c where c.id = events.company_id and c.owner_id = auth.uid()));
drop policy if exists events_delete_owner on public.events;
create policy events_delete_owner on public.events for delete using (exists (select 1 from public.companies c where c.id = events.company_id and c.owner_id = auth.uid()));

-- event_rsvps: 本人のみ
drop policy if exists rsvps_own on public.event_rsvps;
create policy rsvps_own on public.event_rsvps
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- endorsements: 全員読める / 自分の endorse だけ書ける
drop policy if exists endorsements_select_all on public.endorsements;
create policy endorsements_select_all on public.endorsements for select using (true);
drop policy if exists endorsements_insert_self on public.endorsements;
create policy endorsements_insert_self on public.endorsements for insert with check (auth.uid() = endorser_id);
drop policy if exists endorsements_delete_self on public.endorsements;
create policy endorsements_delete_self on public.endorsements for delete using (auth.uid() = endorser_id);

-- reports: 自分の通報だけ見える・書ける / adminは全部見える
drop policy if exists reports_insert_self on public.reports;
create policy reports_insert_self on public.reports for insert with check (auth.uid() = reporter_id);
drop policy if exists reports_select_self_or_admin on public.reports;
create policy reports_select_self_or_admin on public.reports for select using (
  auth.uid() = reporter_id
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
drop policy if exists reports_update_admin on public.reports;
create policy reports_update_admin on public.reports for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- audit_logs: adminのみ select
drop policy if exists audit_select_admin on public.audit_logs;
create policy audit_select_admin on public.audit_logs for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- user_settings: 本人のみ
drop policy if exists settings_own on public.user_settings;
create policy settings_own on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- company_updates: 全員読める / 自社のみ書き込み
drop policy if exists upd_select_all on public.company_updates;
create policy upd_select_all on public.company_updates for select using (true);
drop policy if exists upd_owner_all on public.company_updates;
create policy upd_owner_all on public.company_updates for all using (
  exists (select 1 from public.companies c where c.id = company_updates.company_id and c.owner_id = auth.uid())
) with check (
  exists (select 1 from public.companies c where c.id = company_id and c.owner_id = auth.uid())
);

-- search_history: 本人のみ
drop policy if exists sh_own on public.search_history;
create policy sh_own on public.search_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 17. RPC: セマンティック求人検索 (pgvector)
-- ---------------------------------------------------------------------------
create or replace function public.match_jobs(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count     int   default 10
)
returns table (
  id uuid, title text, company_id uuid, similarity float
)
language sql stable
as $$
  select j.id, j.title, j.company_id, 1 - (j.embedding <=> query_embedding) as similarity
  from public.job_postings j
  where j.embedding is not null
    and j.is_draft = false
    and (j.deadline is null or j.deadline > now())
    and 1 - (j.embedding <=> query_embedding) > match_threshold
  order by j.embedding <=> query_embedding
  limit match_count;
$$;

-- RPC: レコメンド求人 (プロフィール埋め込み × 求人埋め込み)
create or replace function public.recommend_jobs(
  for_user uuid,
  match_count int default 10
)
returns table (
  id uuid, title text, company_id uuid, similarity float
)
language sql stable
as $$
  with p as (
    select embedding from public.profiles where id = for_user and embedding is not null
  )
  select j.id, j.title, j.company_id, 1 - (j.embedding <=> p.embedding) as similarity
  from public.job_postings j, p
  where j.embedding is not null
    and j.is_draft = false
    and (j.deadline is null or j.deadline > now())
  order by j.embedding <=> p.embedding
  limit match_count;
$$;

-- ---------------------------------------------------------------------------
-- 18. ビュー: 企業のレビュー集計 / フォロワー数
-- ---------------------------------------------------------------------------
create or replace view public.company_stats as
  select
    c.id as company_id,
    (select count(*) from public.follows f where f.target_type = 'company' and f.target_id = c.id) as follower_count,
    (select coalesce(round(avg(rating)::numeric, 1), 0) from public.reviews r where r.company_id = c.id and not r.is_hidden) as avg_rating,
    (select count(*) from public.reviews r where r.company_id = c.id and not r.is_hidden) as review_count
  from public.companies c;

-- ---------------------------------------------------------------------------
-- 19. トリガー: 応募が入ったら notifications にも書き込み
-- ---------------------------------------------------------------------------
create or replace function public.notify_application()
returns trigger as $$
declare
  company_owner uuid;
begin
  select c.owner_id into company_owner
  from public.companies c where c.name = new.job_company
  limit 1;
  if company_owner is not null then
    insert into public.notifications (user_id, kind, title, body, link)
    values (company_owner, 'application', '新着応募', new.job_title || ' に応募がありました', '/company-dashboard.html');
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_application_created on public.applications;
create trigger on_application_created
  after insert on public.applications
  for each row execute function public.notify_application();

-- ---------------------------------------------------------------------------
-- 20. pg_cron: 週次ダイジェスト / 締切切れ求人クローズ
-- ---------------------------------------------------------------------------
-- 毎日 0時: 締切を過ぎた求人を下書きに戻す
select cron.schedule(
  'close-expired-jobs',
  '0 0 * * *',
  $$ update public.job_postings set is_draft = true where deadline is not null and deadline < now() and is_draft = false; $$
);

-- 毎週月曜 9時: saved_searches の last_checked_at 更新 (Edge Function をトリガーするのは別途)
select cron.schedule(
  'update-saved-search-checked',
  '0 9 * * 1',
  $$ update public.saved_searches set last_checked_at = now(); $$
);

-- 毎日 3時: 7日以上古い search_history を削除
select cron.schedule(
  'cleanup-search-history',
  '0 3 * * *',
  $$ delete from public.search_history where created_at < now() - interval '7 days'; $$
);

-- ---------------------------------------------------------------------------
-- 21. Storage バケット作成 (Dashboard でも作成可)
-- ---------------------------------------------------------------------------
-- Dashboard → Storage → New bucket:
--   - logos     (Public)
--   - covers    (Public)
--   - resumes   (Private)
--   - portfolios(Private)
--   - avatars   (Public)
--
-- SQL でも可:
insert into storage.buckets (id, name, public) values
  ('logos','logos', true),
  ('covers','covers', true),
  ('resumes','resumes', false),
  ('portfolios','portfolios', false),
  ('avatars','avatars', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 22. contacts (問い合わせフォーム) - 誰でも書ける / admin のみ読める
-- ---------------------------------------------------------------------------
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  kind text,
  body text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.contacts enable row level security;
drop policy if exists contacts_insert_any on public.contacts;
create policy contacts_insert_any on public.contacts for insert with check (true);
drop policy if exists contacts_select_admin on public.contacts;
create policy contacts_select_admin on public.contacts for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);
drop policy if exists contacts_update_admin on public.contacts;
create policy contacts_update_admin on public.contacts for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- ---------------------------------------------------------------------------
-- 23. Storage RLS ポリシー
-- ---------------------------------------------------------------------------
-- logos / covers / avatars (public) は誰でも閲覧可、ログインユーザーのみ書き込み可
-- パスは user_id/filename の形式にする (supabase-biz.js の uploadFile に合わせ)

drop policy if exists "public buckets read" on storage.objects;
create policy "public buckets read" on storage.objects
  for select using (bucket_id in ('logos','covers','avatars'));

drop policy if exists "authenticated upload to own folder" on storage.objects;
create policy "authenticated upload to own folder" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('logos','covers','avatars','resumes','portfolios')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "authenticated update own files" on storage.objects;
create policy "authenticated update own files" on storage.objects
  for update to authenticated using (
    bucket_id in ('logos','covers','avatars','resumes','portfolios')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "authenticated delete own files" on storage.objects;
create policy "authenticated delete own files" on storage.objects
  for delete to authenticated using (
    bucket_id in ('logos','covers','avatars','resumes','portfolios')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- private バケットは自分のフォルダ内のみ read 可
drop policy if exists "private buckets own read" on storage.objects;
create policy "private buckets own read" on storage.objects
  for select to authenticated using (
    bucket_id in ('resumes','portfolios')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 応募された resume はその企業owner も読めるようにする (admin経由 or 応募紐付けで)
-- ここではシンプル化のため、signed URL での共有前提とする

-- ---------------------------------------------------------------------------
-- 24. tsvector 全文検索 RPC (job_postings)
-- ---------------------------------------------------------------------------
create or replace function public.search_jobs_ft(
  q text,
  match_count int default 30
)
returns setof public.job_postings
language sql stable
as $$
  select j.*
  from public.job_postings j
  where j.is_public = true and j.status = 'approved' and j.is_draft = false
    and to_tsvector('simple', coalesce(j.title,'') || ' ' || coalesce(j.description,'')) @@ plainto_tsquery('simple', q)
  order by j.created_at desc
  limit match_count;
$$;

-- ============================================================================
-- 実行完了ログ
-- ============================================================================
do $$ begin raise notice 'schema-v3.sql 適用完了'; end $$;
