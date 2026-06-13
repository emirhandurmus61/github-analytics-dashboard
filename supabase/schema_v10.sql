-- schema_v10: Gelişmiş Hedef Sistemi (Faz 2.5)
-- user_goals: çok tipli hedefler (günlük commit, haftalık PR, aylık aktif gün, quarterly yeni repo)

CREATE TABLE IF NOT EXISTS user_goals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('daily_commit','weekly_pr','monthly_active_days','quarterly_new_repo')),
  target      integer NOT NULL CHECK (target > 0),
  is_active   boolean NOT NULL DEFAULT true,
  chain_order integer NOT NULL DEFAULT 0,  -- zincirleme sırası (0 = bağımsız)
  created_at  timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,               -- NULL = henüz tamamlanmadı
  UNIQUE (user_id, type, is_active)        -- bir tip için en fazla bir aktif hedef
);

CREATE INDEX IF NOT EXISTS user_goals_user_id_idx ON user_goals(user_id);

-- goal_achievements: hangi günlerde hedef tamamlandı (başarı takvimi için)
CREATE TABLE IF NOT EXISTS goal_achievements (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id    uuid NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
  achieved_on date NOT NULL,
  UNIQUE (user_id, goal_id, achieved_on)
);

CREATE INDEX IF NOT EXISTS goal_achievements_user_id_idx ON goal_achievements(user_id);
