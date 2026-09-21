# Access keys — MiniDAW Collaborative

Prototype gates (not full Auth). Change these before sharing widely.

## Studio dashboard unlock

Required to open the sessions dashboard on the public Pages URL.

| Key | Value |
| --- | --- |
| Studio unlock | `minidaw-studio-2026` |

Override in build env as `VITE_STUDIO_ACCESS_KEY` (Pages + local `.env`).

Stored in `sessionStorage` after unlock (clears when the browser tab session ends).

## Room / session password

Every session needs a room password to create and to open.

| Context | Value |
| --- | --- |
| You choose when creating | e.g. `friday-band` |
| Migrated legacy rooms | `minidaw-room` |

Codes are stored as SHA-256 hashes in Postgres (`access_code_hash`). The plaintext is never listed in the dashboard.

## Presence display name

Your collaborator name is kept in `localStorage` as `minidaw.display-name` and broadcast with Supabase Realtime Presence while you are inside a room.
