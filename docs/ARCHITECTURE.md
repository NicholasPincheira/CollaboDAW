# Architecture

## Architecture goal

Keep the system modular enough that an audio, realtime, synchronization, or persistence implementation can be replaced without rewriting the application.

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
FX Chain
    ↓
Track Bus
    ↓
Master Bus
    ↓
Output Router
```

Recording uses a tap before monitor-only effects when possible.

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
    └── remote track subscription

PERSISTENCE PLANE
Supabase
    ├── Auth
    ├── Postgres metadata
    └── Storage assets
```

Never make WebSocket the primary transport for live instrument audio.

## Replaceable providers

### AudioEngine

- `WebAudioEngine`
- Future native/WASM implementation

### RealtimeMediaProvider

- `LiveKitRealtimeMediaProvider`
- Experimental `PeerToPeerWebRTCProvider`
- Future provider

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
