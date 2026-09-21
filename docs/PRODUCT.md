# Product Definition

## Working name

MiniDAW Collaborative

## Product intent

A small browser-based DAW/laboratory for testing the practical experience of low-latency collaborative music in a desktop browser.

The product is intentionally experimental. The first objective is not feature parity with a traditional DAW; it is validating the user experience and measuring the constraints of browser audio.

## Primary use case

Two musicians connect their audio interfaces to their own computers, enter the same session, select/assign their local inputs, hear themselves with low latency, hear the other participant through realtime audio, and share a common musical transport/metronome.

Example:

- User A: Input 1 = microphone, Input 2 = guitar.
- User B: Input 1 = microphone, Input 2 = guitar.
- Each user sees the other's tracks/participant identity.
- Both clients generate the click locally from a shared musical clock.
- Recorded takes can be stored as local/project assets.

## MVP definition

### Phase 0: Audio Lab

- Request microphone/audio permission.
- Enumerate devices.
- Select an input device.
- Detect channel count.
- Split multichannel input into independent channels.
- Map channels to logical roles.
- Monitor input.
- Display input meters.
- Display sample rate and latency diagnostics.
- Select an output device when supported.
- Stop/restart audio safely.
- Handle unsupported output selection gracefully.

### Phase 1: MiniDAW local

- 2+ local tracks.
- Track names and roles.
- Gain.
- Pan.
- Mute.
- Solo.
- Input arm.
- Master output.
- Local click/metronome.
- Basic transport.

### Phase 2: Basic DSP

- Distortion.
- Reverb.
- Delay.
- Compressor.
- Simple EQ.

Effects should be bypassable and replaceable.

### Phase 3: Recording

- Record dry input.
- Playback.
- Take management.
- WAV/PCM path later; MediaRecorder can be the first experiment.

### Phase 4: Timeline / musical structure

- Clips.
- Grid.
- Markers.
- Time signature.
- Tempo.
- Tempo map with multiple sections.

### Phase 5: Collaborative session

- Create session.
- Join session.
- Participant presence.
- Shared transport state.
- Shared tempo map.

### Phase 6: Realtime audio

- WebRTC media.
- LiveKit adapter.
- Publish local track(s).
- Subscribe to remote tracks.
- Per-participant remote monitoring.

### Phase 7: Sync laboratory

- RTT.
- Clock offset.
- Jitter.
- Drift measurement.
- Soft correction.
- Hard resync action.

### Phase 8: Persistence

- Authentication.
- Project metadata.
- Audio asset storage.
- Presets.
- Project versions.
- Import/export.

## Non-goals for the first MVP

- ASIO driver replacement in the browser.
- Full plugin marketplace.
- Full VST compatibility.
- Professional mastering.
- Video collaboration.
- Mobile-first support.
- Cross-browser feature parity before Chromium desktop is stable.

## Success criteria

The MVP is successful when a developer can:

1. Connect a supported 2-input interface.
2. See and validate both channels.
3. Assign input roles.
4. Monitor with predictable low-latency behavior.
5. Understand measured local audio latency.
6. Record a take.
7. Connect a second participant.
8. Hear remote audio.
9. Observe synchronization diagnostics.
10. Repeat the same experiment with a different interface profile.
