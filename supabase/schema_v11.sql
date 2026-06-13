-- schema_v11: Web Push Bildirimleri (Faz 3.1)
-- Supabase SQL Editor'de tek seferde çalıştır

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL,
  endpoint   text NOT NULL,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint)
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions(user_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS push_notify_streak  boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_notify_goal    boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_notify_badge   boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_notify_summary boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_notify_hour    integer NOT NULL DEFAULT 20;
