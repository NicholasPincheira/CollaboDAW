# Realtime Audio and Synchronization

## Core rule

WebSocket / Supabase Realtime is **not** the live-instrument audio transport.

Use:

- **WebRTC** (or LiveKit adapter) for **media**.
- A **control** transport for state, presence, tempo, sync anchors.
- **Postgres + Storage** for durable project metadata and assets.

## Implementation gate

WebRTC/LiveKit slices start **only after**:

1. Audio Lab stable on target hardware (UMC22, iTrack Solo, Scarlett Solo).
2. Documented local latency benchmarks (`baseLatency`, `outputLatency`, subjective 1–5).
3. Dry recording path designed (Milestone 4) — optional but recommended before remote jam.

See `docs/ARCHITECTURE.md` implementation gate.

## Phase 1: two-user experiment

A direct peer-to-peer WebRTC adapter can be used for experiments if it gives useful data. Keep the interface identical to the scalable provider.

## Phase 2: scalable realtime

Use LiveKit as the default realtime-media provider behind `RealtimeMediaProvider`.

Conceptual flow:

```text
AudioEngine
    ↓
MediaStreamTrack
    ↓
RealtimeMediaProvider
    ↓
LiveKit / WebRTC
    ↓
Remote participants
    ↓
Remote MediaStreamTrack
    ↓
AudioEngine / Remote Track (same Track domain)
```

## Participant model

A participant may publish multiple tracks:

```text
Participant
 ├── Mic
 ├── Guitar
 └── Future tracks...
```

Remote tracks use the same `Track` model as local inputs with `sourceType: remote-participant`. No special UI-only remote objects.

## Per-participant monitor mix (ADR-017)

Each user builds a private mix of local + subscribed remote tracks.

Example:

```text
Nicholas Guitar   Monitor ON   Transmit ON   Record ON
Nicholas Mic      Monitor OFF  Transmit OFF  Record ON
Friend Guitar     Subscribe ON Monitor ON   (remote)
```

Friend may choose a different combination. See `docs/specs/AUDIO-MONITOR-MIX.md`.

## Mute vs Subscribe (critical)

| Action | Effect |
| --- | --- |
| **Mute** | Track still received; excluded from local audible mix |
| **Unsubscribe** | Client stops receiving remote media; saves bandwidth/CPU |

Never implement mute as a substitute for unsubscribe. LiveKit supports selective track subscription.

## Session control events

Use explicit versioned events:

```ts
TransportStart
TransportStop
TransportPause
TempoChanged
TempoMapChanged
TrackArmed
TrackMuted
TrackSoloChanged
TrackTransmitChanged
TrackSubscribeChanged
ParticipantJoined
ParticipantLeft
ResyncRequested
ResyncApplied
```

Every timing-sensitive event should carry a session timestamp/anchor rather than relying on "receive now".

## Shared musical clock

The server/session authority maintains a logical timeline:

```text
session beat
session time
tempo map
transport state
revision
anchor
```

Each client maps that timeline to its local `AudioContext`.

## Why the click is local (ADR-002)

Do not transmit a click audio stream merely to synchronize musicians.

Instead broadcast:

- BPM / tempo map;
- time signature;
- transport state;
- future anchor time;
- revision number.

Each client generates the click locally.

## Clock synchronization

Measure:

- round-trip time;
- estimated offset;
- jitter;
- drift.

A simple first synchronizer can use repeated request/response timestamp exchanges and robust median filtering.

The implementation must expose an abstraction so the algorithm can evolve later.

## Soft correction

Small timing errors should be corrected by adjusting future scheduling rather than jumping the audible timeline.

## Hard resync

The resync button should:

1. Request/receive an authoritative session anchor.
2. Calculate offset.
3. Rebuild the next scheduling horizon.
4. Align on a musical boundary when practical.
5. Never alter recorded media.

## Latency diagnostics (decomposed)

Show distinct values — never one headline number:

```text
LOCAL MONITOR
  baseLatencyMs
  outputLatencyMs
  localMonitorPathMs (estimate; label gaps)

NETWORK (control and/or media)
  rttMs
  jitterMs
  packetLossPercent

REMOTE AUDIO
  remoteOneWayEstimateMs (est. when not directly measured)

SESSION
  clockOffsetMs
  clockDrift
  lastResync
```

### Targets (ADR-018)

- Local software monitor: **<15 ms** preferred.
- Remote one-way: **<=30 ms** target.

Mark `est.` when the value is not directly measured end-to-end.

## IA on remote path (ADR-019)

Neural PLC may be experimented on the **receiver** only, default off, A/B vs no PLC. Not part of baseline latency presets. Not a substitute for WebRTC media design.

## Related specs

- `docs/specs/REMOTE-AUDIO-AND-COLLABORATION.md`
- `docs/specs/LATENCY-TARGETS.md`
- `docs/specs/COLLAB-UX-CHECKLIST.md`
