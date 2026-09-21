-- Room access codes (SHA-256 hex). Do not expose in list APIs.
alter table public.work_sessions
  add column if not exists access_code_hash text;

-- Existing rooms: unlock with documented default "minidaw-room"
update public.work_sessions
set access_code_hash = encode(digest('minidaw-room', 'sha256'), 'hex')
where access_code_hash is null or access_code_hash = '';

alter table public.work_sessions
  alter column access_code_hash set not null;

comment on column public.work_sessions.access_code_hash is
  'SHA-256 hex of room access code. Never return in public summaries.';
