# UI / UX Direction

## Visual objective

Modern studio workstation, compact, clear, playful but professional. Avoid generic SaaS dashboards.

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

Prefer:

```text
52 ms path · base 10 · out 42 · 48000 Hz · live | record | …
```

Explain that browser metrics exclude AD/DA and USB. Offer Direct Monitor tip for playing feel.

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
