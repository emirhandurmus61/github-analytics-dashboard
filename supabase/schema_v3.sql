-- V3 Migration: Profil özelleştirme alanları
-- Supabase SQL Editor'da çalıştır

-- users tablosuna profil alanları ekle
alter table users
  add column if not exists bio text,
  add column if not exists pinned_repo_name text,
  add column if not exists public_widgets jsonb default '{"heatmap":true,"languages":true,"repos":true,"streak":true}'::jsonb,
  add column if not exists theme_accent text default 'emerald';
