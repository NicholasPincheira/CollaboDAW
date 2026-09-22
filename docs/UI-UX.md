# UI / UX Direction

## Visual objective

Modern studio workstation, compact, clear, playful but professional. Avoid generic SaaS dashboards.

**Reference (2026-09):** DAW Live lobby — glass cards (`backdrop-blur`), cyan gradient accents, pill tabs, lucide icons, staggered GSAP entrances. See `docs/ideas/` for the prior platform mock; CollaboDAW reuses the **style**, not the old content stack (no shadcn/radix required — Tailwind + GSAP + lucide-react).

## Viewport rule (required)

Studio shell must fit **one viewport** (`100dvh`) without page scroll.

- Fixed header + transport + tempo ruler
- Flexible center (tracks | clip lanes) scrolls internally if needed
- Bottom Audio Lab / Diagnostics is a **collapsible drawer** (`max-h ~28vh`), not an always-tall stack
- Prefer BandLab-like density over dashboard cards

## Main shell

```text
┌───────────────────────────────────────────────────────────────┐
│ Sessions  MiniDAW  Presence  BPM  4/4  Latency HUD  Save      │
├───────────────────────────────────────────────────────────────┤
│ Rewind Play Stop Record   time   latency tip                  │
├───────────────┬───────────────────────────────────────────────┤
│ SECTIONS      │ Tempo blocks (above tracks, not inside lanes) │
├───────────────┼───────────────────────────────────────────────┤
│ TRACKS        │ CLIP LANES (recorded audio lives here)        │
│ Input 1 M S ≡ │ ──────── empty / future waveform ────────     │
│ Input 2 M S ≡ │ ──────── empty / future waveform ────────     │
├───────────────┴───────────────────────────────────────────────┤
│ Drawer tabs: Device / Diagnostics   [Collapse]                │
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
