# Supabase

1. Create a Supabase project.
2. Open SQL Editor and run `migrations/20260921_work_sessions.sql`.
3. Copy the **Project URL** and **anon public** key into `apps/web/.env`:

```text
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

4. Restart `npm run dev` / redeploy the Worker.

Do **not** put `sb_secret_*` or service-role keys in the frontend. Those bypass RLS and must stay server-side only.

Until env vars exist, the app uses a local `localStorage` session catalog so the dashboard still works.
