---
name: studio-ui
description: >-
  CollaboDAW studio shell UI — bottom drawers (~35dvh), glass/cyan DAW Live look,
  responsive layout, and incremental shadcn-style patterns without replacing the Vite app.
  Use when editing StudioWorkspace, lobby/dashboard chrome, Audio Lab / Diagnostics panels,
  or adopting UI component libraries for this repo only.
---

# Studio UI (CollaboDAW project skill)

## Scope

Project-local only (`.cursor/skills/studio-ui/`). Do **not** install global personal skills for this work.

## Shell rules

1. Studio stays **one viewport**: `h-dvh` / `100dvh`, no page scroll.
2. Header + transport + sections stay `shrink-0`.
3. Timeline + mixer fill remaining space and scroll **internally**.
4. **Audio Lab / Diagnostics** open as a **bottom horizontal panel** at about **35% of viewport height** (`h-[35dvh]` / `min-h-[12rem]` caps on small screens).
5. Closed drawer = tab bar only (`shrink-0`). Open drawer must not push the page into scroll — the center grid shrinks.
6. Prefer existing primitives: `GlassCard`, `StudioButton`, `PillTabs`, `GradientText`, `lucide-react`, GSAP for motion (never for audio clock).

## Responsive

| Breakpoint | Behavior |
| --- | --- |
| `< md` | Mixer stacks under timeline or collapses; drawer still ~35dvh; denser HUD wraps |
| `md+` | Timeline + mixer side-by-side; drawer full width under both |
| Drawer content | Always `overflow-auto` inside the 35dvh panel |

## shadcn / dashboard kits

Reference only (do not wholesale replace CollaboDAW):

- [shadcn/ui Blocks](https://ui.shadcn.com/blocks) — free patterns
- [shadcn-admin](https://github.com/satnaing/shadcn-admin) — Vite-friendly admin reference
- Next starters (dashboard-starter, Studio Admin) — **Next.js**; copy ideas, not the app shell

### Adoption policy (this repo)

1. Prefer Tailwind + our primitives first.
2. If adding shadcn: init **inside `apps/web`** only (Vite), copy components we need (Tabs, Button, Sheet, ScrollArea).
3. Before adding Radix/`class-variance-authority`/`tailwind-merge`, check `AGENTS.md` dependency policy and ask the user.
4. Never import LiveKit/Supabase into UI chrome.

## Feedback loop

After a visible UI change, ask the user whether the result matches what they want (density, 35% panel, colors). Iterate only on that feedback — do not expand into WebRTC/recording unless asked.

## Anti-patterns

- Full-page shadcn admin templates over the DAW shell
- Cards stacked that force `body` scroll in the studio
- Drawer taller than ~40dvh without explicit user approval
- GSAP driving musical timing
