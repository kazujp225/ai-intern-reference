-- ============================================================================
-- AIme サイト用 Supabase スキーマ
-- Supabase Dashboard → SQL Editor で全体を実行してください
-- （既に実行済みのテーブルはエラーになります。IF NOT EXISTSで対応）
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. プロフィール (auth.users の拡張)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  school text,
  avatar_color text default '#2e7d32',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- signup時に自動でprofilesレコードを作成するトリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname, school)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'school'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. 投稿 (ブログ / 掲示板)
-- ---------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  tags text[] default '{}',
  view_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_author_id_idx on public.posts (author_id);

-- ---------------------------------------------------------------------------
-- 3. コメント (投稿・求人どちらにも付けられる)
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'job')),
  target_id text not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists comments_target_idx on public.comments (target_type, target_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. いいね (投稿・求人どちらにも付けられる)
-- ---------------------------------------------------------------------------
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'job')),
  target_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);
create index if not exists likes_target_idx on public.likes (target_type, target_id);

-- ---------------------------------------------------------------------------
-- 5. ブックマーク (求人のお気に入り)
-- ---------------------------------------------------------------------------
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id text not null,
  job_company text,
  job_title text,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);
create index if not exists bookmarks_user_idx on public.bookmarks (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 6. 応募 (マイページ用)
-- ---------------------------------------------------------------------------
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id text not null,
  job_company text,
  job_title text,
  status text not null default 'pending' check (status in ('pending','reviewing','accepted','rejected')),
  message text,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);
create index if not exists applications_user_idx on public.applications (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 7. 求人統計（閲覧数ランキング用）
-- ---------------------------------------------------------------------------
create table if not exists public.job_stats (
  job_id text primary key,
  view_count int not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.increment_job_view(p_job_id text)
returns void as $$
begin
  insert into public.job_stats (job_id, view_count)
  values (p_job_id, 1)
  on conflict (job_id) do update
    set view_count = public.job_stats.view_count + 1,
        updated_at = now();
end;
$$ language plpgsql security definer;

-- ---------------------------------------------------------------------------
-- RLS 設定
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.posts        enable row level security;
alter table public.comments     enable row level security;
alter table public.likes        enable row level security;
alter table public.bookmarks    enable row level security;
alter table public.applications enable row level security;
alter table public.job_stats    enable row level security;

-- profiles: 全員読める、自分のだけ書ける
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- posts: 全員読める、ログイン済みで自分の投稿のみ書き込み/削除
drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all" on public.posts for select using (true);
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert with check (auth.uid() = author_id);
drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts for update using (auth.uid() = author_id);
drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts for delete using (auth.uid() = author_id);

-- comments
drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments for select using (true);
drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments for insert with check (auth.uid() = author_id);
drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments for delete using (auth.uid() = author_id);

-- likes: 全員読める、自分のだけ作成・削除
drop policy if exists "likes_select_all" on public.likes;
create policy "likes_select_all" on public.likes for select using (true);
drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own" on public.likes for insert with check (auth.uid() = user_id);
drop policy if exists "likes_delete_own" on public.likes;
create policy "likes_delete_own" on public.likes for delete using (auth.uid() = user_id);

-- bookmarks: 自分のだけ全操作
drop policy if exists "bookmarks_all_own" on public.bookmarks;
create policy "bookmarks_all_own" on public.bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- applications: 自分のだけ全操作
drop policy if exists "applications_all_own" on public.applications;
create policy "applications_all_own" on public.applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- job_stats: 全員読める、更新はRPC経由（security definer）
drop policy if exists "job_stats_select_all" on public.job_stats;
create policy "job_stats_select_all" on public.job_stats for select using (true);

-- ---------------------------------------------------------------------------
-- Realtime 有効化 (Postgres Changes を受けるテーブル)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.likes;
alter publication supabase_realtime add table public.bookmarks;

-- 完了
