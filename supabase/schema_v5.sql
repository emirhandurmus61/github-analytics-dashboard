-- I.2: Haftalık hedef DB'ye taşınıyor

-- users tablosuna weekly_commit_goal kolonu
alter table users
  add column if not exists weekly_commit_goal integer default 20;

-- Haftalık hedef geçmişi
create table if not exists weekly_goal_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  week_start date not null,        -- o haftanın Pazartesi'si
  goal integer not null,
  actual integer not null default 0,
  created_at timestamptz default now(),
  unique(user_id, week_start)
);

create index if not exists weekly_goal_history_user_week_idx
  on weekly_goal_history(user_id, week_start desc);

alter table weekly_goal_history enable row level security;

create policy "Service role write" on weekly_goal_history
  for all using (auth.role() = 'service_role');
