# Realtime Audio and Synchronization

## Core rule

WebSocket is not the live-instrument audio transport.

Use:

- WebRTC for media.
- A control transport for state.
- A persistent database for durable project data.

## Phase 1: two-user experiment

A direct peer-to-peer WebRTC adapter can be used for experiments if it gives useful data. Keep the interface identical to the scalable provider.

## Phase 2: scalable realtime

Use LiveKit as the default realtime-media provider.

Conceptual flow:

```text
AudioEngine
    ↓
MediaStreamTrack
    ↓
RealtimeMediaProvider
    ↓
LiveKit
    ↓
Remote participants
    ↓
Remote MediaStreamTrack
    ↓
AudioEngine / Remote Track
```

LiveKit supports publishing custom `MediaStreamTrack` instances and publishing/receiving data, which makes it suitable for the media-provider boundary.

## Participant model

A participant may publish multiple tracks:

```text
Participant
 ├── Mic
 ├── Guitar
 └── Future tracks...
```

A remote track should become a normal DAW track with source metadata, not a special UI-only object.

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

## Why the click is local

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

## Latency diagnostics

Show distinct values:

```text
Local audio
  base latency
  output latency

Network
  RTT
  jitter
  packet loss

Session
  clock offset
  drift
  last resync
```

Do not present an invented single number as "total latency" unless the measurement method is explicitly documented.
