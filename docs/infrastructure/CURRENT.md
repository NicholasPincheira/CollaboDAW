# Infraestructura — estado actual (2026-09)

## Resumen

| Capa | Tecnología | Rol hoy |
| --- | --- | --- |
| Frontend | React + Vite + TS | Studio, Audio Lab, Dashboard |
| Hosting | **Cloudflare Pages** | `collabodaw-pages.pages.dev` |
| CI/CD | Git push → Pages build | Root `apps/web`, output `dist` |
| Control / presence | **Supabase Realtime** | Quién está en la sesión, RTT probe |
| Metadata | **Supabase Postgres** | `work_sessions` (JSON proyecto) |
| Media audio | — | **No desplegado** (WebRTC/LiveKit pendiente) |
| Auth | — | Host key en env; Supabase Auth pendiente |
| Storage audio | — | Pendiente (Milestone 4+) |

## Cloudflare Pages

```text
GitHub: NicholasPincheira/CollaboDAW (main)
    │
    ▼
Build en Cloudflare
  Root directory: apps/web
  Command: npm run build
  Output: dist
    │
    ▼
https://collabodaw-pages.pages.dev
```

### Variables de entorno (build)

| Variable | Dónde | Notas |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Pages env | Público en bundle |
| `VITE_SUPABASE_ANON_KEY` | Pages env | Solo anon/publishable |
| `VITE_STUDIO_ACCESS_KEY` | Pages env | Crear sesiones host-only (nunca en git) |
| `NODE_VERSION` | Pages env | `22` recomendado |

**Nunca** `sb_secret_*` en frontend.

GitHub Actions secrets **no** alimentan el build nativo de Pages — las vars deben existir en Cloudflare.

Ver `docs/DEPLOY.md`.

## Supabase (proyecto `dgsnfagreqzumnhzcuir`)

### Uso actual

| Feature | Tabla / canal | Datos |
| --- | --- | --- |
| Session catalog | `work_sessions` | Nombre, project JSON, access hash |
| Presence | Realtime channel | Nombres participantes |
| Control probe | Realtime broadcast | RTT/jitter tiny payloads |

### Límites free tier relevantes

Ver `docs/SUPABASE-LIMITS.md`:

- 500 MB DB — solo metadata
- 5 GB egress/mes — presence + probes OK si no abusamos
- No PCM en Postgres

## Acceso y seguridad

| Regla | Implementación |
| --- | --- |
| Join público | Room id + password |
| Create host-only | `VITE_STUDIO_ACCESS_KEY` |
| RLS | On en `work_sessions` |
| Secret keys | Solo server-side futuro |

Ver `docs/ACCESS.md`.

## Worker `collabodaw`

Worker separado (legacy/alternativo SPA). **Deploy principal = Pages Git.**

Backup manual: `.github/workflows/deploy-worker.yml` (`workflow_dispatch`).

## Estructura de código (runtime)

```text
apps/web/src/
├── ui/              React (no audio DSP)
├── application/     controllers, use cases
├── domain/          contratos puros
└── infrastructure/  Supabase, Web Audio, adapters
```

Monorepo de paquetes (`packages/*`) **no** split aún — ADR-009.

## Qué no está en producción

- WebRTC / LiveKit media
- SessionClock sync sobre media
- Grabación a Storage
- Auth usuario final
- Edge Functions (solo si hace falta lógica server)

## Checklist operativo

- [ ] Pages build verde en `main`
- [ ] Vars VITE en Cloudflare production + preview
- [ ] Migraciones Supabase aplicadas
- [ ] Host key rotada si se filtró en chat
