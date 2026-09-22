---
name: studio-ui
description: >-
  CollaboDAW studio shell UI — compact footer tools, overlay sheets (~35dvh),
  horizontal drag strips (GSAP), glass/cyan DAW Live look, Outfit typography.
  Use when editing StudioWorkspace, lobby/dashboard chrome, Audio Lab / Diagnostics,
  or considering UI kits (shadcn / AudioUI) for this repo only.
---

# Studio UI (CollaboDAW project skill)

## Scope

Project-local only (`.cursor/skills/studio-ui/`). Do **not** install global personal skills for this work.

## Shell rules

1. Studio stays **one viewport**: `h-dvh` / `100dvh`, no page scroll.
2. Header + transport + sections stay `shrink-0`.
3. Timeline + mixer fill remaining space and scroll **internally**.
4. **Audio Lab / Diagnostics** live in a **compact footer bar**. Opening a tab shows an **overlay sheet** (~`48dvh`, up to ~28rem) floating **above** the footer — it must **not** push the timeline down. Prefer fitting strip cards without a vertical scrollbar; horizontal pan only.
5. Closed = footer only. Open = backdrop + sheet; click backdrop or Close to dismiss.
6. Tool content uses `StudioDragStrip`: quick click selects a card; hold (~140ms) or move ≥8px pans horizontally (GSAP transform). Never use GSAP for audio timing.
7. Prefer existing primitives: `GlassCard`, `StudioButton`, `PillTabs`, `GradientText`, `lucide-react`.

## Typography

- UI: **Outfit** (`--font-sans` / `--font-heading`)
- Metrics: **JetBrains Mono** (`--font-mono`)
- Dense controls: `text-[10px]`–`text-[11px]`, tight padding (`py-1` / `py-1.5`)

## Responsive

| Breakpoint | Behavior |
| --- | --- |
| `< lg` | Mixer stacks under timeline; overlay still ~35dvh; strip cards ~78vw |
| `lg+` | Timeline + mixer side-by-side; overlay full width under both |
| Overlay body | `overflow-y-auto` inside the sheet; strip pans horizontally |

## shadcn / dashboard kits

Reference only — density/layout ideas, not a wholesale replace:

- [shadcn/ui Blocks](https://ui.shadcn.com/blocks)
- [shadcn-admin](https://github.com/satnaing/shadcn-admin) (Vite-friendly)

## AudioUI (Cutoff)

Visual/reference playground: [AudioUI Playground](https://playground.cutoff.dev/) · docs: [cutoff.dev](https://cutoff.dev/audio-ui/docs/latest/getting-started/installation)

- Package: `@cutoff/audio-ui-react` (knobs, sliders, etc.)
- License: **GPL-3.0-only** (developer preview) — do **not** install until the user explicitly accepts GPL for this app
- Until then: keep dense Tailwind controls; optional local knob later behind an adapter

### Adoption policy (this repo)

1. Prefer Tailwind + our primitives first.
2. Ask before adding Radix / shadcn / AudioUI dependencies (`AGENTS.md` dependency policy).
3. Never import LiveKit/Supabase into UI chrome.

## Feedback loop

After a visible UI change, ask whether footer/overlay density, strip drag, and typography match intent. Iterate on that feedback only.

## Anti-patterns

- Expanding flex drawers that shrink the timeline when tools open
- Full-page shadcn/AudioUI admin templates over the DAW shell
- Overlay taller than ~40dvh without approval
- GSAP driving musical timing
- Pulling GPL AudioUI without an explicit license decision
