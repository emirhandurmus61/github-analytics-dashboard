-- V6 Migration: Pinned repos array (max 3) + profile readme
-- Supabase SQL Editor'da calistir

-- pinned_repo_name (text) -> pinned_repos (text[])
alter table users
  add column if not exists pinned_repos text[] default '{}';

-- Mevcut pinned_repo_name verisini tasi
update users
  set pinned_repos = array[pinned_repo_name]
  where pinned_repo_name is not null and pinned_repo_name != '';

-- Profil README icerigi (markdown)
alter table users
  add column if not exists profile_readme text;

-- Profile gorselleri icin storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- Herkes okuyabilir
create policy "Public read profile images"
  on storage.objects for select
  using (bucket_id = 'profile-images');

-- Sadece service role yazabilir (API route uzerinden)
create policy "Service upload profile images"
  on storage.objects for insert
  with check (bucket_id = 'profile-images');
