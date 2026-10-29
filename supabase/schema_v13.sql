-- Kullanıcının saat dilimi (IANA). Günlük commit gruplaması ve streak buna göre yapılır.
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone text;
