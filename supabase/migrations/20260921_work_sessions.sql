-- MiniDAW Collaborative — initial persistence schema
-- Run in Supabase SQL Editor. Do not store PCM audio in these tables.

create extension if not exists pgcrypto;

create table if not exists public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bpm numeric not null default 120,
  sample_rate integer not null default 48000,
  time_signature_num integer not null default 4,
  time_signature_den integer not null default 4,
  project_document jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists work_sessions_updated_at_idx
  on public.work_sessions (updated_at desc);

alter table public.work_sessions enable row level security;

-- Prototype policies: open read/write for anon until Auth lands.
-- Replace with authenticated owner policies before production sharing.
drop policy if exists "work_sessions_select_anon" on public.work_sessions;
drop policy if exists "work_sessions_insert_anon" on public.work_sessions;
drop policy if exists "work_sessions_update_anon" on public.work_sessions;
drop policy if exists "work_sessions_delete_anon" on public.work_sessions;

create policy "work_sessions_select_anon"
  on public.work_sessions for select
  to anon, authenticated
  using (true);

create policy "work_sessions_insert_anon"
  on public.work_sessions for insert
  to anon, authenticated
  with check (true);

create policy "work_sessions_update_anon"
  on public.work_sessions for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "work_sessions_delete_anon"
  on public.work_sessions for delete
  to anon, authenticated
  using (true);
