# Roadmap

## Milestone 0 — Repository bootstrap

Status: Done

- React + TypeScript + Vite
- Tailwind v4
- GSAP
- typed domain contracts
- Cursor rules/skills
- test/typecheck/lint/build scripts

## Implementation gate (do not skip)

```text
docs + ADRs
  → Audio Lab
  → UMC22 / iTrack Solo / Scarlett Solo
  → measure real latency (enumerateDevices, getSettings, base/outputLatency)
  → ONLY THEN recording
  → ONLY THEN WebRTC / LiveKit
```

## Milestone 1 — Audio Lab

Status: Implemented in app — **hardware acceptance and empirical benchmarks pending**

- device enumeration
- permission flow
- input capture
- multichannel detection
- channel splitting
- per-channel meters
- monitoring
- output selection when supported
- latency diagnostics
- safe shutdown
- known hardware profiles + manual remap + Learn Input overrides

Acceptance:

- iTrack Solo works or clearly reports browser limitations.
- UMC22 works or clearly reports browser limitations.
- Scarlett Solo profile resolves correctly by model family when identifiable.
- Unknown devices can be manually mapped.

Observed implementation limits (2026-09-21):

- Independent output routing requires `AudioContext.setSinkId()`; otherwise the browser default output is used.
- `outputLatency` is shown only when the browser exposes it.
- Software monitoring can create speaker feedback; monitoring defaults to off.
- Learn Input identifies the strongest exposed browser channel, not physical jack identity.
- Chromium desktop over HTTPS remains the supported target.

## Milestone 2 — Local MiniDAW

Status: Started (usable essentials 2026-09-21)

- editable BPM / time signature / tempo map sections
- local click Play/Stop on AudioContext
- mute / solo / gain on input tracks → monitor
- dual output (primary sink + secondary `<audio>` sink)
- latency presets (live/record/rehearsal/mix)
- host-only create; public join with room id + password

Still pending: full `TrackRoutingState` (MON/TX/RX/R), rewind/record, clip timeline, shared transport over Realtime.

**Note:** Current mute/solo/gain is a partial local monitor subset — not the full spec in `docs/specs/AUDIO-MONITOR-MIX.md`.

## Milestone 3 — Effects

- EQ
- compressor
- distortion
- reverb
- delay

## Milestone 4 — Recording

**Gate:** Milestone 1 hardware benchmarks documented on at least one target interface.

- dry tap before monitor FX
- MediaRecorder prototype
- take metadata
- playback
- download/export

## Milestone 5 — Timeline

- waveform/clips
- grid
- markers
- tempo map
- transport positioning

## Milestone 6 — Session control

- session create/join
- participant presence
- shared transport
- shared tempo map
- explicit event revisions

## Milestone 7 — Realtime audio

**Gate:** Local latency measured; recording path specified; ADR-017 routing model ready in domain.

- WebRTC adapter
- LiveKit adapter
- multi-track publication
- selective subscribe / unsubscribe (distinct from mute)
- per-participant remote monitoring

## Milestone 8 — Synchronization laboratory

- clock offset
- RTT
- jitter
- drift
- soft correction
- hard resync
- synchronization visualization

## Milestone 9 — Persistence

Status: Started (session catalog)

- Dashboard home for create/open/recent sessions
- `SessionCatalog` with local + Supabase adapters
- SQL migration for `work_sessions`
- Auth / asset storage still pending

## Milestone 10 — Optimization experiments

Compare measured results for:

- P2P vs SFU
- control transports
- scheduler implementations
- codec/settings experiments
- AudioWorklet/WASM strategies

Do not perform these comparisons before the base Audio Lab is stable.

## Research track — Latency / collaboration

Status: **architecture decisions closed** (2026-09-21). **Empirical validation open** on real hardware.

- Final report: `docs/research/2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md`
- Specs: `docs/specs/`
- ADRs: ADR-017, ADR-018, ADR-019 (+ ADR-016 presets)
- Learning guides: `docs/learn/`
- Next slice: **Audio Lab hardware benchmarks** (not WebRTC, not recording, not full DAW)
- IA: default off; remote-plc and NAM remain future experiments (ADR-019)
