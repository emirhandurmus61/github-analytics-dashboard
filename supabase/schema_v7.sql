-- schema_v7: Sosyal linkler
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS social_twitter  text,
  ADD COLUMN IF NOT EXISTS social_linkedin text,
  ADD COLUMN IF NOT EXISTS social_website  text,
  ADD COLUMN IF NOT EXISTS social_discord  text;
