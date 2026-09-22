# MiniDAW Collaborative — Agent Instructions

## Mission

Build an experimental collaborative browser mini-DAW focused first on proving local low-latency audio behavior on Windows desktop browsers, then progressively adding recording, effects, collaboration, clock synchronization, persistence, and project portability.

The first hardware targets are:

- Focusrite iTrack Solo
- Focusrite Scarlett Solo 3rd Gen
- Focusrite Scarlett Solo 4th Gen
- Behringer U-Phoria UMC22

The initial browser target is Chromium desktop (Chrome/Edge) over HTTPS. Treat hardware/browser capabilities as runtime facts, never as assumptions.

## Product Principles

1. Audio correctness before feature count.
2. Measure before optimizing.
3. Separate UI, audio, realtime transport, persistence, and infrastructure.
4. Every external service must be replaceable through an adapter.
5. Build vertical slices instead of large speculative rewrites.
6. Keep the project usable even when realtime collaboration is unavailable.
7. Prefer local generation of musical timing (click/metronome) over transmitting click audio.
8. WebSocket/DataChannel are control paths; WebRTC is the media path.

## Technology Direction

Frontend:

- React
- TypeScript
- Vite
- Tailwind CSS v4
- GSAP

Audio:

- Web Audio API
- AudioWorklet for custom processing
- Tone.js may be used behind a transport adapter for musical scheduling
- Native Web Audio nodes for simple effects

Realtime:

- WebRTC for audio media
- LiveKit as the scalable realtime-media adapter
- Supabase Realtime or a dedicated WebSocket service for control/state when appropriate

Backend / persistence:

- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Cloudflare Worker/Pages Functions only where server-side logic is required

Deployment:

- Cloudflare Pages initially; keep deployment portable

## Required Architecture Boundaries

The following domains must remain independent:

- UI
- Application/use cases
- Audio Engine
- Audio DSP
- Audio Device Management
- Audio Recording
- Session / Musical Transport
- Clock Synchronization
- Realtime Media
- Session Control
- Project Format
- Persistence / Storage
- Infrastructure adapters

Never place low-level audio or WebRTC logic directly inside React components.

## Required Interfaces

At minimum, the architecture must provide replaceable abstractions for:

- `AudioEngine`
- `AudioDeviceManager`
- `AudioDeviceProfileRegistry`
- `ChannelMapper`
- `AudioRecorder`
- `EffectProcessor`
- `MusicalTransport`
- `SessionClock`
- `ClockSynchronizer`
- `RealtimeMediaProvider`
- `SessionTransport`
- `ProjectRepository`
- `AssetStorage`

## Audio Rules

Do not use React state as an audio-rate data bus.

Do not use:

- `setInterval`
- `setTimeout`
- `requestAnimationFrame`

as the authoritative musical clock.

Use `AudioContext.currentTime`, scheduled Web Audio events, and a dedicated `SessionClock` for collaboration.

The click must be generated locally on each client. Share transport state and timing anchors, not click samples.

For the first audio graph, prefer:

`Input -> ChannelMapper -> Track -> FX -> Track Bus -> Master -> Output`

Create a dry recording tap before monitor effects when recording is enabled.

## Device Compatibility

Never assume that an audio interface's physical inputs map 1:1 to browser devices.

Use:

1. `enumerateDevices()` to discover devices.
2. `getUserMedia()` to request permission and obtain the selected stream.
3. `MediaStreamTrack.getSettings()` where useful to inspect runtime settings.
4. A hardware-profile registry for known devices.
5. A generic multichannel mode for unknown devices.
6. Manual channel mapping and an optional "Learn Input" workflow.

Known-device profiles are hints for default mapping. They must not override actual runtime capabilities.

## Latency / Diagnostics

Expose separate metrics when supported:

- AudioContext sample rate
- base latency
- output latency
- local monitor path estimate (partial — not full instrument→ear when Direct Monitor is on)
- input channel count (from `getSettings()`)
- network RTT
- jitter
- packet loss
- synchronization offset
- drift / phase error

Never present a single latency value as if it describes the complete instrument-to-ear path.

Engineering targets (ADR-018): local software monitor **<15 ms** preferred; remote one-way **<=30 ms**. Mark estimates with `est.`

## Implementation gate

Do not implement WebRTC, LiveKit media, recording, IA, NAM, or full collaborative routing until:

1. Architecture docs and ADRs are read (`docs/specs/`, `docs/research/2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md`).
2. Audio Lab is validated on target hardware (UMC22, iTrack Solo, Scarlett Solo).
3. Real benchmarks are captured via `enumerateDevices()`, `getSettings()`, `baseLatency`, `outputLatency`.

Order: **Audio Lab → measure → recording → WebRTC**. See `docs/ARCHITECTURE.md`.

## Track routing (target)

Each track separates Monitor, Transmit, Record Arm, Mute, Subscribe — per participant for monitor/mute/subscribe. **Mute ≠ Unsubscribe.** Direct Monitor is hardware/user-managed, not Web Audio. Spec: `docs/specs/AUDIO-MONITOR-MIX.md`.

## Performance

Realtime audio processing must not depend on React render cycles.

Avoid allocations, JSON work, logging, or heavy computation inside `AudioWorkletProcessor.process()`.

Use Canvas or another efficient rendering strategy for dense timeline/meter visuals when the DOM would become expensive.

Do not introduce SharedArrayBuffer, WebAssembly, WAM, native helpers, or complex DSP frameworks until profiling shows a real need.

## UX Direction

The UI should feel like a compact modern studio workstation rather than a generic admin dashboard.

Core areas:

- transport
- timeline
- tracks
- mixer
- participants
- device setup
- effects
- latency diagnostics
- project browser

Use Tailwind for structure and visual system. Use GSAP for transitions and microinteractions, never for audio timing.

## Coding Standards

- TypeScript strict mode.
- Clean, modular code.
- SOLID principles where they improve boundaries.
- Prefer small focused modules.
- Avoid needless abstractions that do not protect a real change boundary.
- Explicit types for domain objects.
- No `any` unless justified and documented.
- Handle browser permission failures and unsupported APIs explicitly.
- Add tests for deterministic logic.

## Dependency Policy

Before adding a dependency:

1. Check whether the Web Platform already provides the capability.
2. Explain what problem the dependency solves.
3. Check bundle/performance impact.
4. Isolate it behind an adapter when it is infrastructure or a major runtime dependency.

## Agent Workflow

Before implementing any meaningful feature:

1. Read `AGENTS.md`.
2. Read the relevant docs under `docs/` (including `docs/specs/` when touching audio, latency, or collaboration).
3. Read applicable skills under `.cursor/skills/`.
4. Inspect existing code and dependencies.
5. Identify the architectural boundary.
6. Implement the smallest vertical slice.
7. Run typecheck, lint, tests, and build.
8. Measure performance-sensitive paths.
9. Update documentation and decision records.
10. Report files changed, tests run, known limitations, and the next smallest step.

Do not mix unrelated refactors into a feature.

## Definition of Done

A feature is not complete until:

- it respects the module boundaries;
- unsupported browser/hardware cases are handled;
- types compile;
- tests pass where applicable;
- build passes;
- the relevant documentation is updated;
- no new architecture coupling was introduced accidentally.
