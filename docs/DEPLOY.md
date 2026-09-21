# Cloudflare deploy — MiniDAW

## Why `collabodaw-pages` says "No Git connection"

That project was created with **Direct Upload** (Wrangler / GitHub Actions uploads `dist`).

Cloudflare rule: a Direct Upload Pages project **cannot** later switch to Git integration. That is why the badge stays on "No Git connection".

Your `dark-webgame` Worker is different: it uses **Workers Builds + GitHub**, so the dashboard shows `NicholasPincheira/DARK-WebGame`.

## Target setup (same model as dark-webgame)

Use the Worker **`collabodaw`** (not the Pages Direct Upload project):

1. Open https://dash.cloudflare.com → Workers & Pages → **collabodaw**
2. Settings → **Build** → Connect Git repository
3. Authorize Cloudflare on GitHub if prompted
4. Select `NicholasPincheira/CollaboDAW`
5. Build settings:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Root directory | `apps/web` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Build variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

After that, the Worker row should show the GitHub repo like `dark-webgame`.

Optional: delete or ignore `collabodaw-pages` if you only want one production URL (`collabodaw.*.workers.dev`).

## GitHub Actions (backup / also works)

`.github/workflows/deploy-pages.yml` deploys the **Worker** `collabodaw` on every push to `main`.

### Secrets

| Secret | Required |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | yes |
| `CLOUDFLARE_API_TOKEN` | yes (correct spelling with **L**) |
| `VITE_SUPABASE_URL` | yes |
| `VITE_SUPABASE_ANON_KEY` | yes — use **anon** or **publishable** key, never `sb_secret_*` |

If you still have a typo secret `CLOUDFARE_API_TOKEN`, rename/recreate it as `CLOUDFLARE_API_TOKEN`.

## Token permissions (image 6 vs dark-webgame)

### For GitHub Actions → Worker deploy (like CI)

`miniDAW token` with only **Cloudflare Pages:Edit** is **not enough** for `wrangler deploy` to a Worker.

Add at least:

| Permission | Access |
| --- | --- |
| Account → **Workers Scripts** | Edit |
| Account → **Account Settings** | Read |
| Account → **Cloudflare Pages** | Edit (optional, only if you still deploy Pages) |

You do **not** need the full dark-webgame token (+23 permissions). That token is over-scoped for MiniDAW.

### For native Cloudflare Git connection (Workers Builds)

Connecting Git in the dashboard uses Cloudflare’s GitHub App. Cloudflare can auto-create a build token. You do not need to copy dark-webgame’s permission list for that path.

## Supabase keys (image 2)

| Key | Use |
| --- | --- |
| Publishable / legacy **anon** | Browser / Vite / GitHub Actions build (`VITE_SUPABASE_ANON_KEY`) |
| **Secret** `sb_secret_*` | Server only — never put in Vite, Pages, Workers frontend, or GitHub frontend secrets |

`public.work_sessions` is already created via MCP with RLS.
