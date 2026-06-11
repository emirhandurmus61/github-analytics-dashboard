-- schema_v9: GitHub profil README desteği
-- github_readme: sync sırasında GitHub'dan çekilen README içeriği
-- readme_source: 'github' (varsayılan) veya 'custom' — hangi README gösterilecek

ALTER TABLE users ADD COLUMN IF NOT EXISTS github_readme text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS readme_source text NOT NULL DEFAULT 'github';
