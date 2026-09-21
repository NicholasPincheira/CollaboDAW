# Cloudflare deploy — MiniDAW

## Status

- GitHub repo connected to **collabodaw-pages** ✅
- Secrets correctamente nombrados (`CLOUDFLARE_API_TOKEN` con L) ✅
- Último build Git `ae4d462` falló → casi siempre por **root directory** / **output** / **env vars**

## Cloudflare Pages build settings (required)

In **collabodaw-pages → Settings → Builds**:

### Option A (preferred)

| Setting | Value |
| --- | --- |
| Root directory | `apps/web` |
| Build command | `npm run build` |
| Output directory | `dist` |

### Option B (repo root)

| Setting | Value |
| --- | --- |
| Root directory | empty / `/` |
| Build command | `npm run build` |
| Output directory | `apps/web/dist` |

### Build environment variables

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://dgsnfagreqzumnhzcuir.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | anon o publishable (nunca `sb_secret_*`) |
| `NODE_VERSION` | `22` |

Then open the failed deployment → **Retry deployment**.

## Why the old "No Git connection" happened

The first `collabodaw-pages` uploads were Direct Upload. After you connected GitHub, the project now shows `NicholasPincheira/CollaboDAW`.

`dark-webgame` is a Worker with Workers Builds. Same idea, different product surface.

## Token permissions

For Pages Git builds, Cloudflare uses its own build credentials. Your **miniDAW token** with **Cloudflare Pages: Edit** is enough for Wrangler/Actions Pages deploys.

You do **not** need the huge dark-webgame token (+23 permissions) for MiniDAW.

If you also deploy the Worker `collabodaw` with Actions, add **Workers Scripts: Edit**.

## GitHub Actions

`.github/workflows/deploy-worker.yml` is **manual backup only** (`workflow_dispatch`). Primary deploys = Cloudflare Pages ↔ GitHub.

Secrets:

| Secret | Status |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | ok |
| `CLOUDFLARE_API_TOKEN` | ok (correct spelling) |
| `VITE_SUPABASE_URL` | ok |
| `VITE_SUPABASE_ANON_KEY` | ok |

## Supabase

- Project `dgsnfagreqzumnhzcuir`
- Table `public.work_sessions` exists (RLS on)
- Frontend: publishable/anon only — never secret keys
