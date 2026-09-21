# Audio Architecture and Audio Lab

## Browser APIs

Primary APIs:

- `navigator.mediaDevices.enumerateDevices()`
- `navigator.mediaDevices.getUserMedia()`
- `MediaStreamTrack.getSettings()`
- `AudioContext`
- `AudioWorklet`
- `MediaRecorder` for the first recording experiment
- `AudioContext.setSinkId()` / `HTMLMediaElement.setSinkId()` when supported

These APIs are permission- and browser-dependent. Always feature-detect and present the limitation in the UI.

## Initial device flow

```text
Enumerate devices
    ↓
User grants permission
    ↓
Refresh devices
    ↓
Select input
    ↓
getUserMedia(audio constraints)
    ↓
MediaStreamAudioSourceNode
    ↓
ChannelSplitter
    ↓
Logical inputs
```

## Capture constraints

Start conservatively. Suggested request:

```ts
{
  audio: {
    deviceId: { exact: selectedDeviceId },
    channelCount: { ideal: 2 },
    sampleRate: { ideal: 48000 },
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  }
}
```

Do not assume the browser will honor every requested constraint. Inspect `track.getSettings()` afterward.

## Latency modes

### Live

Prioritize interactive latency. Avoid expensive monitor effects.

### Record

Keep monitoring stable and allow dry capture. Effects may be monitor-only.

### Rehearsal

Balanced local monitoring with remote audio enabled later.

### Mix

Higher latency is acceptable if it enables more expensive processing.

The actual `AudioContext.baseLatency` should be displayed after initialization. A requested `latencyHint` is a request, not a guarantee.

## Audio graph

```text
                    ┌──── Dry Record Tap
                    │
Input → Gain → Split┤
                    │
                    └──── FX → Pan → Track Bus
                                      │
                                      ├── Meter
                                      │
All tracks ────────────────────────────┴──→ Master
                                              │
                                              ├── Recorder (optional)
                                              └── Output Router
```

## Monitoring

Support:

- software monitoring;
- hardware/direct monitoring awareness;
- safe mute behavior to avoid feedback loops;
- monitor-only effects.

Do not assume hardware direct monitoring can be controlled by browser software.

## Effects

First effects:

- Gain
- Biquad EQ
- Compressor
- Distortion / WaveShaper
- Convolver reverb or simple algorithmic reverb
- Delay
- Stereo panner

Custom DSP goes in AudioWorklet.

## Recording strategy

Stage 1:

`MediaStream -> MediaRecorder -> Blob`

Stage 2:

`AudioWorklet -> PCM -> Worker -> WAV encoder`

Keep both behind `AudioRecorder`.

## Audio Lab UI requirements

Display:

- selected input device;
- detected profile;
- channel count;
- channel meter per logical input;
- sample rate;
- base latency;
- output latency if available;
- selected output device;
- monitoring state;
- browser support flags.

Actions:

- Start Audio
- Stop Audio
- Test Input
- Learn Input
- Configure Inputs
- Refresh Devices
- Resync later, once SessionClock exists

## Failure cases

Handle explicitly:

- permission denied;
- device disconnected;
- device busy / unavailable;
- unsupported channel count;
- unsupported output selection;
- AudioContext suspended;
- browser policy restrictions;
- invalid deviceId;
- stream ended unexpectedly.
