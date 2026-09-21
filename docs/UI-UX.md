# UI / UX Direction

## Visual objective

Modern studio workstation, compact, clear, playful but professional. Avoid generic SaaS dashboards.

## Main shell

```text
┌───────────────────────────────────────────────────────────────┐
│ MINI DAW   Session: Friday Jam   ● LIVE   120 BPM   18 ms   │
├───────────────────────────────────────────────────────────────┤
│  ◀  ▶  ■  REC       4/4       00:03:12       RESYNC         │
├───────────────┬───────────────────────────────────────────────┤
│ TRACKS        │ TIMELINE                                      │
│               │                                               │
│ 🎤 Mic        │ ───────── waveform ────────────              │
│ 🎸 Guitar     │ ─────── waveform ───────────────            │
│ ● Friend Gtr  │ ─────────────── waveform ──────             │
│               │                 │ playhead                  │
├───────────────┴───────────────────────────────────────────────┤
│ MIXER / FX / DEVICE / SESSION PANELS                         │
└───────────────────────────────────────────────────────────────┘
```

## Information hierarchy

Always make these states visually obvious:

- audio active/inactive;
- recording armed;
- participant connected/disconnected;
- latency health;
- sync status;
- muted/solo tracks;
- device selection.

## Device setup UX

Provide a focused Audio Lab before the main DAW:

- device selector;
- profile badge;
- channel mapping;
- meters;
- diagnostics;
- test / learn buttons.

## Latency UX

Prefer:

```text
Audio
7.8 ms

Network
24 ms RTT

Sync
+1.4 ms
```

rather than a single scary red number.

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
- sufficient contrast;
- labels for every meter/control;
- no meaning conveyed by color alone;
- stop audio/recording controls must be easy to locate.
