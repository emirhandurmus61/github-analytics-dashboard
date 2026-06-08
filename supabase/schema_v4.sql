-- V4 Migration: Widget sıralama + Özel profil bölümleri
-- Supabase SQL Editor'da çalıştır

alter table users
  add column if not exists widget_order jsonb default '["streak","heatmap","languages","repos"]'::jsonb,
  add column if not exists currently_working_on text,
  add column if not exists yearly_goal text,
  add column if not exists tech_tags text[] default '{}';
