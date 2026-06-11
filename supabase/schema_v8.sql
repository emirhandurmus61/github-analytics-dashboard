-- schema_v8: Profil ziyaretçi sayacı
CREATE TABLE IF NOT EXISTS profile_views (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at   timestamptz NOT NULL DEFAULT now(),
  visitor_ip  text  -- bot filtresi için; hassas değil, hash'lenmiş
);

CREATE INDEX IF NOT EXISTS profile_views_user_id_viewed_at ON profile_views (user_id, viewed_at DESC);

-- RLS
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Servis rolü her şeyi yapabilir
CREATE POLICY "service_all" ON profile_views
  FOR ALL USING (true) WITH CHECK (true);
