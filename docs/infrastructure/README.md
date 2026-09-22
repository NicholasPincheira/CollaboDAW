# Infraestructura — CollaboDAW

Documentación de **qué corre hoy** y **cómo escalar** sin reescribir el dominio.

| Documento | Contenido |
| --- | --- |
| [Estado actual](./CURRENT.md) | Cloudflare, Supabase, GitHub, límites free tier |
| [Escala y crecimiento](./SCALING.md) | Fases 0→4, cuándo cambiar adapter, costos orientativos |

## Mapa mental

```text
Usuario (Chrome desktop)
    │
    ▼
Cloudflare Pages ──→ SPA estática (apps/web/dist)
    │
    ├── Supabase Auth (futuro)
    ├── Supabase Postgres ── work_sessions metadata
    ├── Supabase Realtime ── presence + control probe
    └── (futuro) Supabase Storage ── takes WAV

Media audio en vivo (futuro)
    └── WebRTC P2P → LiveKit SFU (adapter)
```

## Principio de escala

> **Escala cambiando adapters, no mezclando capas.**

Ver `docs/ARCHITECTURE.md` y ADR-007 (LiveKit como adapter).
