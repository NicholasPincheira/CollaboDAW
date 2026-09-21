# Cloudflare Pages — MiniDAW

Project: `collabodaw-pages`  
Production URL after deploy: https://collabodaw-pages.pages.dev

## Automatic deploy from GitHub

This repo uses GitHub Actions (`.github/workflows/deploy-pages.yml`) so every push to `main` builds `apps/web` and deploys to Cloudflare Pages.

### One-time secrets in GitHub

Repo → Settings → Secrets and variables → Actions:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | `aeaf61158acd9b193e38f43dc286c8f1` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token with **Cloudflare Pages — Edit** |
| `VITE_SUPABASE_URL` | `https://dgsnfagreqzumnhzcuir.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase **anon** / publishable key (not `sb_secret_*`) |

Create the API token at: https://dash.cloudflare.com/profile/api-tokens  
Use the "Edit Cloudflare Workers" template, or custom with Account → Cloudflare Pages → Edit.

### Optional: native Cloudflare Git connection

Cloudflare can also build from Git without Actions, but a Pages project created with Direct Upload cannot later switch to Git integration. To use native Git builds, create a **new** Pages project from the dashboard with GitHub connected from the start, root `apps/web`, build `npm run build`, output `dist`, and the same Vite env vars.

## Local

```text
cd apps/web
cp .env.example .env   # fill anon key + url
npm run build
npx wrangler pages deploy dist --project-name=collabodaw-pages
```
