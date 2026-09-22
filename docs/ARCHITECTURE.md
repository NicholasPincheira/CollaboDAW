# Architecture

## Architecture goal

Keep the system modular enough that an audio, realtime, synchronization, or persistence implementation can be replaced without rewriting the application.

## Implementation gate (required order)

Do not skip ahead to collaborative networking before local measurement on real hardware.

```text
docs + ADRs locked
    ↓
Audio Lab (local only)
    ↓
UMC22 / iTrack Solo / Scarlett Solo acceptance
    ↓
Measure real latency (enumerateDevices, getSettings, baseLatency, outputLatency)
    ↓
ONLY THEN → recording (dry tap)
    ↓
ONLY THEN → WebRTC / LiveKit media
```

Empirical numbers from your interfaces become part of project research, not theoretical defaults alone.

## Layers

```text
Presentation
    React / Tailwind / GSAP

Application
    Use cases / controllers / orchestration

Domain
    Track / Project / Session / Transport / Clock contracts

Infrastructure adapters
    Web Audio / AudioWorklet / LiveKit / Supabase / Storage
```

## Proposed monorepo

```text
minidaw/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── domain/
│   ├── application/
│   ├── audio-engine/
│   ├── audio-dsp/
│   ├── audio-devices/
│   ├── audio-recorder/
│   ├── session-clock/
│   ├── realtime/
│   ├── project-format/
│   ├── project-storage/
│   ├── ui/
│   └── testing/
├── docs/
├── prompts/
├── .cursor/
└── AGENTS.md
```

A simpler initial repository may keep these as folders inside `apps/web/src` until the boundaries are actually needed; do not split into packages only to create ceremony. The architectural interfaces must still exist.

## Dependency direction

```text
UI
 ↓
Application
 ↓
Domain contracts
 ↑
Adapters / Infrastructure
```

The application/domain must not import LiveKit or Supabase directly.

## Audio architecture

```text
DeviceManager
    ↓
Input Capture
    ↓
ChannelMapper
    ↓
Track Graph
    ↓
FX Chain (monitor path)
    ↓
Track Bus
    ↓
Master Bus
    ↓
Output Router
```

Recording uses a dry tap **before** monitor-only effects when possible.

### Dual path (local)

```text
Input ──┬── Dry Record Tap
        └── Monitor FX ──> Local Mix ──> Master ──> Output
```

### Direct Monitor (hardware)

Direct Monitor is a **physical path** on the interface (UMC22, Scarlett, etc.). The web app does not control it unless a future hardware API exists. Document it as user-managed; software monitor is independent.

## Track routing model (target domain)

Each track exposes independent states — never one `enabled` boolean:

| State | Scope | Meaning |
| --- | --- | --- |
| Monitor | Per-participant view | Audible in local mix |
| Transmit | Track / session | Published to remote media |
| Record Arm | Track | Captured to project |
| Mute | Per-participant view | Received but silenced locally |
| Subscribe | Per-participant view | Remote media delivered at all |
| Volume / Pan | Per-participant view | Local mix controls |

**Local monitoring and remote monitoring are independent.** Nicholas's mix does not change Friend's mix.

Current Audio Lab implements a **subset** (mute/solo/gain on local channels). Full `TrackRoutingState` is specified in `docs/specs/AUDIO-MONITOR-MIX.md` — not yet implemented.

## Realtime architecture

```text
CONTROL PLANE
Supabase Realtime / WebSocket / DataChannel
    ├── presence
    ├── transport state
    ├── tempo map
    ├── resync commands
    └── session metadata

MEDIA PLANE
WebRTC / LiveKit
    ├── local track publication
    └── remote track subscription (selective)

PERSISTENCE PLANE
Supabase
    ├── Auth
    ├── Postgres metadata
    └── Storage assets
```

Never make WebSocket the primary transport for live instrument audio.

Remote tracks converge on the same `Track` domain model as local inputs (`sourceType`: local-input | remote-participant | recording | imported-audio).

## Replaceable providers

### AudioEngine

- `WebAudioEngine`
- Future native/WASM implementation

### RealtimeMediaProvider

- `LiveKitRealtimeMediaProvider`
- Experimental `PeerToPeerWebRTCProvider`
- Future provider

Must support selective subscribe/unsubscribe distinct from local mute.

### SessionTransport

- `SupabaseRealtimeTransport`
- `WebSocketTransport`
- `WebRTCDataChannelTransport`

### ProjectRepository

- `SupabaseProjectRepository`
- `LocalProjectRepository`
- `FileProjectRepository`

### AudioRecorder

- `MediaRecorderAudioRecorder`
- `PcmAudioWorkletRecorder`

## Important rule: no React audio state

React may display meters, transport state, device settings, and session state. It must not be the owner of the audio processing loop.

Use an external store or subscription boundary for high-frequency UI telemetry.

## Important rule: clock ownership

- `AudioContext.currentTime` owns local audio scheduling.
- `SessionClock` maps collaborative session time into local audio time.
- UI frames are visualization only.
- **Click is generated locally** on each client from shared tempo/transport anchors — never as remote audio.

## Latency architecture

Never present one number as total latency. Decompose per ADR-018:

- `baseLatencyMs`, `outputLatencyMs`, local monitor path estimate
- `networkRttMs`, jitter, packet loss (control and/or media stats)
- remote one-way estimate (marked `est.` when not directly measured)
- clock offset / drift when SessionClock exists

Targets: local software monitor **<15 ms preferred**; remote one-way **<=30 ms** target.

## Related documentation

- Specs: [`docs/specs/`](./specs/)
- Research (architecture closed 2026-09-21): [`docs/research/2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md`](./research/2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md)
- ADRs: [`docs/DECISIONS.md`](./DECISIONS.md), [`docs/adr/README.md`](./adr/README.md)
- Quick learning: [`docs/learn/README.md`](./learn/README.md)
- Infrastructure: [`docs/infrastructure/README.md`](./infrastructure/README.md)
