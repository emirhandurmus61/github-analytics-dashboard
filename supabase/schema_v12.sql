-- schema_v12: Arkadaş & Takip Sistemi (Faz 3.3)
-- Supabase SQL Editor'de tek seferde çalıştır

-- Takip ilişkisi: follower_id → following_id
CREATE TABLE IF NOT EXISTS follows (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follows_no_self CHECK (follower_id <> following_id),
  CONSTRAINT follows_unique UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS follows_follower_idx  ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_id);

-- Aktivite akışı: takip edilen kişilerin önemli olayları
CREATE TABLE IF NOT EXISTS follow_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('streak_milestone','badge_earned','new_record')),
  payload     jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS follow_activities_user_id_idx ON follow_activities(user_id, created_at DESC);

-- Günlük takip sayacı (spam önlemi: günde max 20 takip)
CREATE TABLE IF NOT EXISTS follow_daily_limits (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        date NOT NULL DEFAULT CURRENT_DATE,
  count       integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);
