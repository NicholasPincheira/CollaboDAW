# Architecture Decision Records (ADR)

## ADR-001 — WebSocket is not the audio media transport

Status: Accepted

Reason:

Reliable low-latency instrument audio requires realtime media semantics. WebSocket remains useful for control/state, but it is not the primary live-audio transport.

## ADR-002 — Generate the click locally

Status: Accepted

Reason:

Transmitting click audio adds network scheduling uncertainty. The session shares musical timing and each client schedules the same click locally using its audio clock.

## ADR-003 — Hardware profiles are advisory and replaceable

Status: Accepted

Reason:

Driver/browser exposure can differ from the physical hardware description. Profiles provide a useful default mapping, but runtime capabilities remain authoritative.

## ADR-004 — Chromium desktop is the first target

Status: Accepted

Reason:

The MVP depends on modern browser audio/device APIs whose support and permission behavior vary. Broad compatibility is a later milestone.

## ADR-005 — Audio is outside React state

Status: Accepted

Reason:

React render cycles are not an audio-rate processing mechanism. Audio graphs and realtime processing live outside the UI.

## ADR-006 — Supabase stores metadata, not raw PCM

Status: Accepted

Reason:

Binary audio assets belong in object storage/files. Database records should describe projects and reference assets.

## ADR-007 — LiveKit is an adapter, not the domain model

Status: Accepted

Reason:

The experiment is about the experience and architecture, not permanent vendor lock-in. LiveKit can be replaced by another realtime implementation later.

## ADR-008 — Measure before introducing WASM / SharedArrayBuffer / native helpers

Status: Accepted

Reason:

Complexity is justified only by measured bottlenecks. The first implementation should favor standards-based browser APIs and simple diagnostics.

## ADR-009 — Keep the first boundaries inside the web app

Status: Accepted

Reason:

The domain contracts need to exist before a package split earns its cost. `apps/web/src` holds `domain`, `application`, `infrastructure`, and `ui`. A package is introduced only when a second runtime needs the same module.

## ADR-010 — Bootstrap does not call external services

Status: Accepted

Reason:

LiveKit, WebRTC, Supabase, and recording stay behind their interfaces and throw or report `unavailable` until a later slice measures a need. In-memory project and asset adapters exist only so the repository boundary is testable without a network.

## ADR-012 — Audio Lab meters are visualization-only

Status: Accepted

Reason:

Peak meters are sampled from AnalyserNode buffers and pushed to the UI through an external store. `requestAnimationFrame` may refresh the display. It is never the musical clock.

## ADR-013 — Software monitoring defaults to off

Status: Accepted

Reason:

Local speaker monitoring can feedback into open microphones. Users must opt in, preferably with headphones or hardware direct monitoring.

## ADR-014 — Session dashboard before the studio

Status: Accepted

Reason:

Users need a home to create and reopen work sessions. The studio only opens after a session is selected. Persistence goes through `SessionCatalog`, with localStorage as the default and Supabase as a replaceable adapter.

## ADR-015 — Frontend uses only Supabase anon credentials

Status: Accepted

Reason:

Service-role / `sb_secret_*` keys bypass RLS and must never ship in Vite. The browser receives only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

## ADR-016 — Experience presets vs optional IA assist

Status: Accepted

Reason:

Latency feel is improved by coherent option bundles (Direct Monitor preference, software monitor on/off, `latencyHint`, sample rate). Those belong in named experience presets players can switch while testing. Neural/PLC assist is a separate, default-off preference so A/B tests stay honest — stubs may store intent before WebRTC/DSP exists without mutating the audio graph.

Detail: see ADR-019 and `docs/adr/ADR-019-AI-IS-ORTHOGONAL-TO-LATENCY.md`.

## ADR-017 — Per-participant monitor mix

Status: Accepted

Reason:

Each participant builds a private monitor mix. Track publication/recording is separate from how each user hears local and remote tracks. Monitor, Transmit, Record Arm, Mute, Subscribe/Receive, gain, and pan must not collapse into one boolean. **Mute ≠ Unsubscribe.**

Detail: `docs/adr/ADR-017-PER-PARTICIPANT-MONITOR-MIX.md`, `docs/specs/AUDIO-MONITOR-MIX.md`.

## ADR-018 — Latency targets (decomposed metrics)

Status: Accepted

Reason:

There is no single product latency number. Local software monitor prefers **<15 ms**; remote one-way target is **<=30 ms**. UI and benchmarks must decompose base, output, RTT, jitter, loss, remote estimate, and clock metrics. Targets are engineering goals backed by NMP references (JackTrip, SonoBus), not universal perception laws.

Detail: `docs/adr/ADR-018-LATENCY-TARGETS.md`, `docs/specs/LATENCY-TARGETS.md`, `docs/research/2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md`.

## ADR-019 — IA orthogonal to latency presets

Status: Accepted

Reason:

IA default OFF. Neural PLC is a future remote-receiver experiment; NAM/WASM is FX/DSP, not a latency fix. No predictive “note guessing” for local monitoring. All latency benchmarks run IA-off first.

Detail: `docs/adr/ADR-019-AI-IS-ORTHOGONAL-TO-LATENCY.md`. Supersedes informal IA guidance only; ADR-016 remains valid for Audio Lab preset bundles.

## ADR numbering note

Research drop-in files originally used ADR-010–012; those numbers were already taken (bootstrap + meters). Canonical new decisions are **ADR-017–019**. See `docs/adr/README.md`.
