---
name: audio-realtime
description: Design and implement low-latency browser audio, AudioWorklet DSP, realtime audio transport, musical scheduling, clock synchronization, monitoring, recording, and latency diagnostics for the MiniDAW.
---

# Audio Realtime Skill

Use this skill for any task touching audio capture, routing, monitoring, AudioWorklet, transport timing, recording, WebRTC media, synchronization, or latency.

## Rules

1. Never put realtime audio processing in React render logic.
2. Never use `setInterval`, `setTimeout`, or `requestAnimationFrame` as the authoritative musical clock.
3. Use `AudioContext.currentTime` for local scheduling.
4. Use `SessionClock` to map shared session time to local audio time.
5. Generate metronome/click locally.
6. Use WebRTC for audio media, not WebSocket.
7. Keep LiveKit behind `RealtimeMediaProvider`.
8. Keep Supabase behind repositories/services.
9. Inspect actual device capabilities after `getUserMedia()`.
10. Avoid allocations and expensive logging in `AudioWorkletProcessor.process()`.

## Audio graph

```text
Input
 -> ChannelMapper
 -> Track
 -> FX
 -> TrackBus
 -> Master
 -> Output
```

When recording:

```text
Input
 ├-> Dry Recorder
 └-> FX -> Monitor
```

## Diagnostics

Collect when supported:

- sample rate;
- base latency;
- output latency;
- input channel count;
- network RTT;
- jitter;
- packet loss;
- clock offset;
- drift.

Never fabricate missing metrics.

## Scheduling

The first prototype may use Tone.js behind `MusicalTransport`, but the application must not depend on Tone.js-specific types in the domain.

## Browser limitations

Feature-detect:

- AudioWorklet;
- output sink selection;
- device enumeration;
- `outputLatency`;
- WebRTC stats.

Gracefully degrade when unsupported.
