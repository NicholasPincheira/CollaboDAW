# Roadmap

## Milestone 0 — Repository bootstrap

Status: Done

- React + TypeScript + Vite
- Tailwind v4
- GSAP
- typed domain contracts
- Cursor rules/skills
- test/typecheck/lint/build scripts

## Milestone 1 — Audio Lab

Status: Implemented in app (hardware acceptance pending on physical interfaces)

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

- track model
- input routing
- gain/pan/mute/solo
- master
- click
- transport

## Milestone 3 — Effects

- EQ
- compressor
- distortion
- reverb
- delay

## Milestone 4 — Recording

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

- WebRTC adapter
- LiveKit adapter
- multi-track publication
- remote monitoring

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
