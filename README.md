# MiniDAW Collaborative

Browser mini-DAW experiment. Audio Lab first, then sessions, then collaboration.

## App

- Live Worker: https://collabodaw.nicholasapz7.workers.dev
- Source app: `apps/web`
- Docs: `docs/`
- Prompts: `prompts/`
- Supabase SQL: `supabase/migrations/`

## Commands

```text
cd apps/web
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run deploy
```

## Sessions & persistence

The home screen lists recent work sessions. Opening one enters the studio / Audio Lab.

- Without env vars: sessions persist in `localStorage`.
- With Supabase: set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` and run `supabase/migrations/20260921_work_sessions.sql`.

Never put service-role / `sb_secret_*` keys in the frontend. See `supabase/README.md`.

## Hardware targets

- Focusrite iTrack Solo
- Focusrite Scarlett Solo 3rd Gen
- Focusrite Scarlett Solo 4th Gen
- Behringer U-Phoria UMC22
