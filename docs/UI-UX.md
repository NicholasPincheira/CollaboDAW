# UI / UX Direction

## Visual objective

Modern studio workstation, compact, clear, playful but professional. Avoid generic SaaS dashboards.

**Reference (2026-09):** DAW Live lobby — glass cards (`backdrop-blur`), cyan gradient accents, pill tabs, lucide icons, staggered GSAP entrances. See `docs/ideas/` for the prior platform mock; CollaboDAW reuses the **style**, not the old content stack (Tailwind + GSAP + lucide; shadcn only if we opt in later — see skill `studio-ui`).

## Viewport rule (required)

Studio shell must fit **one viewport** (`100dvh`) without page scroll.

- Fixed header + transport + tempo ruler
- Flexible center (tracks | clip lanes | mixer) scrolls internally if needed
- Bottom **Audio Lab / Diagnostics** is a collapsible horizontal panel at ~**35% viewport height** (`35dvh`, responsive min/max) — see `StudioBottomPanel`
- Prefer BandLab-like density over generic admin dashboards

## shadcn / dashboard kits

Free references (patterns only until we opt in):

- [shadcn/ui Blocks](https://ui.shadcn.com/blocks)
- [shadcn-admin](https://github.com/satnaing/shadcn-admin) (Vite-friendly)
- Next starters are idea sources, not drop-in replacements

Policy: keep Tailwind + CollaboDAW primitives first; add shadcn components inside `apps/web` only after asking. Project skill: `.cursor/skills/studio-ui/SKILL.md`.

## Main shell

```text
┌───────────────────────────────────────────────────────────────┐
│ Sessions  MiniDAW  Presence  BPM  4/4  Latency HUD  Save      │
├───────────────────────────────────────────────────────────────┤
│ Rewind Play Stop Record   time   latency tip                  │
├───────────────┬───────────────────────────────────────────────┤
│ SECTIONS      │ Tempo blocks (above tracks, not inside lanes) │
├───────────────┼───────────────────────────────────────────────┤
│ TRACKS/LANES  │ CLIP LANES + mixer (center flexes)            │
├───────────────┴───────────────────────────────────────────────┤
│ Bottom panel ~35dvh: Audio Lab | Diagnostics   [Collapse]     │
└───────────────────────────────────────────────────────────────┘
```

Tempo / section controls sit **above** the track+lane grid. Clip lanes stay empty until recording.

## Information hierarchy

Always make these states visually obvious:

- audio active/inactive;
- recording armed;
- participant connected/disconnected;
- latency health (base, output, est. path — never a fake single “guitar-to-ear” number);
- sync status;
- muted/solo tracks;
- device selection.

## Device setup UX

Audio Lab lives in the bottom drawer:

- device selector + dual output;
- latency presets + preferred sample rate;
- profile / channel map / meters;
- diagnostics tab.

## Latency UX

Never show a single headline latency without naming the metric (ADR-018).

Prefer decomposed display:

```text
LOCAL MONITOR
~12 ms path (base 10 + out 2) · partial

NETWORK RTT
24 ms

REMOTE AUDIO
~31 ms est.
```

Explain that browser metrics exclude ADC/DAC/USB and Direct Monitor hardware path. Targets: local software monitor **<15 ms** preferred; remote one-way **<=30 ms**. Mark `est.` when not directly measured.

Track controls (target UX per `docs/specs/COLLAB-UX-CHECKLIST.md`): M, S, R, MON, TX, RX — current app has partial mute/solo/gain only until post-measurement slices.

## GSAP usage

Use GSAP for:

- panel transitions;
- track selection emphasis;
- participant join/leave animations;
- resync feedback;
- meters or decorative animation only when not tied to audio scheduling.

Do not use GSAP as the musical clock.

## Accessibility

- keyboard transport controls;
- visible focus states;
- readable contrast on meters and badges;
- do not rely on color alone for mute/solo/latency health.
