-- GitHub Analytics Dashboard — Veritabanı Şeması
-- Supabase SQL Editor'da çalıştır

-- Kullanıcılar
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  github_id bigint unique not null,
  username text not null,
  name text,
  avatar_url text,
  access_token text,
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

-- Repolar
create table if not exists repositories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  github_id bigint not null,
  name text not null,
  full_name text not null,
  description text,
  language text,
  stars integer default 0,
  forks integer default 0,
  is_fork boolean default false,
  is_archived boolean default false,
  created_at timestamptz,
  updated_at timestamptz,
  unique(user_id, github_id)
);

-- Commitler
create table if not exists commits (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid references repositories(id) on delete cascade,
  sha text not null,
  message text,
  committed_at timestamptz not null,
  additions integer default 0,
  deletions integer default 0,
  unique(repo_id, sha)
);

-- Dil istatistikleri (repo başına)
create table if not exists repo_languages (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid references repositories(id) on delete cascade,
  language text not null,
  bytes bigint default 0,
  recorded_at timestamptz default now(),
  unique(repo_id, language)
);

-- Günlük aktivite özeti
create table if not exists daily_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  commit_count integer default 0,
  repos_active integer default 0,
  lines_added integer default 0,
  lines_deleted integer default 0,
  unique(user_id, date)
);

-- Index'ler (hızlı sorgu için)
create index if not exists commits_committed_at_idx on commits(committed_at desc);
create index if not exists commits_repo_id_idx on commits(repo_id);
create index if not exists daily_stats_user_date_idx on daily_stats(user_id, date desc);
create index if not exists repositories_user_id_idx on repositories(user_id);

-- Row Level Security
alter table users enable row level security;
alter table repositories enable row level security;
alter table commits enable row level security;
alter table repo_languages enable row level security;
alter table daily_stats enable row level security;

-- RLS Politikaları: herkes okuyabilir (public profil için), sadece sahip yazabilir
create policy "Public read access" on users for select using (true);
create policy "Public read access" on repositories for select using (true);
create policy "Public read access" on commits for select using (true);
create policy "Public read access" on repo_languages for select using (true);
create policy "Public read access" on daily_stats for select using (true);

-- Servis rolü yazma yetkisi (API routes server-side'dan yazar)
create policy "Service role write" on users for all using (auth.role() = 'service_role');
create policy "Service role write" on repositories for all using (auth.role() = 'service_role');
create policy "Service role write" on commits for all using (auth.role() = 'service_role');
create policy "Service role write" on repo_languages for all using (auth.role() = 'service_role');
create policy "Service role write" on daily_stats for all using (auth.role() = 'service_role');
