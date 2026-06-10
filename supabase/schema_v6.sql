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
