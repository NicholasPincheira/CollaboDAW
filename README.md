# MiniDAW Collaborative

Browser mini-DAW experiment. Audio Lab first, then sessions, then collaboration.

## App

- Worker (target like dark-webgame): https://collabodaw.nicholasapz7.workers.dev
- Pages Direct Upload (no Git badge by design): https://collabodaw-pages.pages.dev
- Deploy guide: `docs/DEPLOY.md`

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

Supabase project `dgsnfagreqzumnhzcuir` is wired via `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.  
Table `public.work_sessions` is created. Never put `sb_secret_*` keys in the frontend.

Push to `main` deploys Pages when GitHub Actions secrets are set (see `docs/DEPLOY.md`).

## Hardware targets

- Focusrite iTrack Solo
- Focusrite Scarlett Solo 3rd Gen
- Focusrite Scarlett Solo 4th Gen
- Behringer U-Phoria UMC22
