# Access keys — MiniDAW Collaborative

Prototype gates (not full Auth). **Do not commit real host keys.**

## Host key (create rooms)

Set only in:

- local `apps/web/.env` as `VITE_STUDIO_ACCESS_KEY=...`
- Cloudflare Pages → Environment variables → same name

Minimum 8 characters. Without it, **Create session is disabled** (join still works).

Copy your host key here for yourself (this file is tracked — prefer a password manager if the repo is public):

| Key | Where |
| --- | --- |
| Host / studio unlock | Cloudflare Pages `VITE_STUDIO_ACCESS_KEY` + local `.env` |

Suggested private value (rotate anytime): `CollaboDAW-host-7kQ2mN`

## Room passwords

| Context | Value |
| --- | --- |
| You choose when creating | e.g. `friday-band` |
| Migrated legacy rooms | `minidaw-room` |

Anyone with a room id + room password can join. Only hosts with the studio unlock can create.

## Presence display name

Stored in `localStorage` as `minidaw.display-name`.
