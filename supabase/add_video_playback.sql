-- ============================================================
-- Lecture de musique intégrée (YouTube) — à exécuter dans Supabase SQL Editor
-- ============================================================

alter table public.now_playing add column if not exists video_id text;
alter table public.now_playing add column if not exists thumbnail_url text;
