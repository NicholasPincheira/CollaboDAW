# Access keys — MiniDAW Collaborative

Prototype gates (not full Auth). **Never commit real host keys or room passwords.**

## Host key (create rooms)

Set **only** in ignored local env / Cloudflare (not in git):

| Where | Variable |
| --- | --- |
| `apps/web/.env` (gitignored) | `VITE_STUDIO_ACCESS_KEY` |
| Cloudflare Pages → Environment variables | `VITE_STUDIO_ACCESS_KEY` |

Rules:

- Minimum 8 characters.
- Without it, **Create session is disabled** (join still works).
- Store the real value in a password manager or Cloudflare only.

### Placeholder in this repo (fake — does not unlock production)

```text
VITE_STUDIO_ACCESS_KEY=REPLACE_ME_LOCAL_ONLY
```

See `apps/web/.env.example`. Do **not** paste the live host key into markdown, commits, or chat if the repo is public.

## Room passwords

Chosen when you **create** a room. Not stored in plaintext in git.

| Context | Notes |
| --- | --- |
| New rooms | You pick the password at create time (min 4 chars) |
| Join | Need **session UUID** + that room password |

Anyone with room id + room password can join. Only hosts with the studio unlock can create.

## Join example (fill with your live values)

Do not commit real UUIDs/passwords here. For yourself:

| Field | Where to find it |
| --- | --- |
| Session id (UUID) | After create, or from a previous benchmark `sessionId` / host “Recent sessions” |
| Room password | The one you set at create |

## Presence display name

Stored in `localStorage` as `minidaw.display-name`.
