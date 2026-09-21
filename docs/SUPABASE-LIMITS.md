# Supabase usage — MiniDAW

Free plan (approx.):

| Resource | Free limit | MiniDAW use |
| --- | --- | --- |
| Database | 500 MB | Session metadata JSON only (no PCM) |
| Egress | 5 GB / mo | Presence + control pings + REST |
| File storage | 1 GB | Unused until recording assets |
| MAU | 50k | Auth not required yet |

Rules:

- Never store audio samples in Postgres.
- Control-plane probe sends tiny broadcast packets (default 8).
- Presence tracks names only.
- Recorded takes → object storage later, not the free DB.
