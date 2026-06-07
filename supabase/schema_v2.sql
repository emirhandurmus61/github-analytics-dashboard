-- V2 Migration: commits tablosuna additions/deletions ekle
-- pull_requests ve issues tabloları ekle

-- Commits tablosuna eksik kolonlar (zaten var ama 0 dolu, veri gelecek)
-- Mevcut tablo zaten additions/deletions kolonuna sahip, veri dolduracağız

-- Pull Requests tablosu
create table if not exists pull_requests (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid references repositories(id) on delete cascade,
  github_id bigint not null,
  title text,
  state text not null, -- 'open' | 'closed' | 'merged'
  merged boolean default false,
  additions integer default 0,
  deletions integer default 0,
  changed_files integer default 0,
  created_at timestamptz,
  merged_at timestamptz,
  closed_at timestamptz,
  unique(repo_id, github_id)
);

-- Issues tablosu
create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid references repositories(id) on delete cascade,
  github_id bigint not null,
  title text,
  state text not null, -- 'open' | 'closed'
  created_at timestamptz,
  closed_at timestamptz,
  unique(repo_id, github_id)
);

-- Index'ler
create index if not exists pull_requests_repo_id_idx on pull_requests(repo_id);
create index if not exists pull_requests_created_at_idx on pull_requests(created_at desc);
create index if not exists issues_repo_id_idx on issues(repo_id);

-- RLS
alter table pull_requests enable row level security;
alter table issues enable row level security;

create policy "Public read access" on pull_requests for select using (true);
create policy "Public read access" on issues for select using (true);
create policy "Service role write" on pull_requests for all using (auth.role() = 'service_role');
create policy "Service role write" on issues for all using (auth.role() = 'service_role');
