# Audio Architecture and Audio Lab

## Browser APIs

Primary APIs:

- `navigator.mediaDevices.enumerateDevices()`
- `navigator.mediaDevices.getUserMedia()`
- `MediaStreamTrack.getSettings()`
- `AudioContext`
- `AudioWorklet`
- `MediaRecorder` for the first recording experiment (after Audio Lab measurement gate)
- `AudioContext.setSinkId()` / `HTMLMediaElement.setSinkId()` when supported

These APIs are permission- and browser-dependent. Always feature-detect and present the limitation in the UI.

Runtime inspection is mandatory:

1. `enumerateDevices()` — what Chromium exposes after permission.
2. `getSettings()` — actual channel count, sample rate, device ids.
3. `baseLatency` / `outputLatency` — what the browser can observe on the software path.

These readings are project research data, not assumptions.

## Initial device flow

```text
Enumerate devices
    ↓
User grants permission
    ↓
Refresh devices
    ↓
Select input / output
    ↓
getUserMedia(audio constraints)
    ↓
getSettings() — validate runtime
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

## Latency modes (`latencyHint`)

### Live

Prioritize interactive latency. Avoid expensive monitor effects.

### Record

Keep monitoring stable and allow dry capture. Effects may be monitor-only.

### Rehearsal

Balanced local monitoring with remote audio enabled later.

### Mix

Higher latency is acceptable if it enables more expensive processing.

`latencyHint` is a **request**, not a guarantee. Always display measured `baseLatency` and `outputLatency` after init.

## Latency targets (ADR-018)

| Metric | Product target |
| --- | --- |
| Local software monitor | **<15 ms** preferred; 15–20 ms experimental; >30 ms outside instrument target |
| Remote one-way | **<=30 ms** target; mark estimates with `est.` |

Never show a single `Latency: N ms` without naming which metric it is.

See `docs/specs/LATENCY-TARGETS.md`.

## Experience presets (Audio Lab UX bundles)

High-level bundles for A/B testing local feel. **Orthogonal to IA** (ADR-019).

| Id | UI label | Goal | Software monitor | Hint | Notes |
| --- | --- | --- | --- | --- | --- |
| `feel` | **HW Direct** | Press interface Direct Monitor / MIX | off | live @ 48k | Dry HW path — **no** web FX |
| `monitor-sw` | **Web Mon** | Hear via browser (+ future NAM/FX) | on | live @ 48k | Turn HW Direct off to avoid doubling |
| `capture` | **Capture** | Stable dry recording path | off | record @ 48k | Dry tap priority; HW Direct for play-along |

**FX note:** Neural Amp Modeler, reverb, delay, etc. only exist on the **software monitor** graph. Hardware Direct Monitor never carries browser FX — that is why Web Mon exists.

Presets do **not** enable IA. Registry: `domain/audio/experience-presets.ts`.

### Optional IA assist (default off)

| Mode | Role |
| --- | --- |
| `off` | Baseline for all benchmarks |
| `remote-plc` | Future remote packet-loss experiment only |
| `experimental` | Future NAM/DSP experiment only |

IA must not be used to hide local monitoring latency. See research doc §10.

## Audio graph

```text
                    ┌──── Dry Record Tap (before monitor FX)
                    │
Input → Gain → Split┤
                    │
                    └──── Monitor FX → Pan → Track Bus
                                      │
                                      ├── Meter
                                      │
Local tracks ─────────────────────────┴──→ Local Mix
Remote tracks (future) ──────────────────→ Remote Mix
Click (local) ───────────────────────────→ Master → Output
```

## Monitoring

Three concepts — do not conflate:

| Path | Controlled by |
| --- | --- |
| Hardware Direct Monitor | User on interface; **not** Web Audio API today |
| Software monitor | App (`monitorEnabled` per participant view) |
| Remote monitor | Subscribed remote tracks in local mix |

Support:

- software monitoring (opt-in);
- hardware/direct monitoring awareness in UI copy;
- safe mute behavior to avoid feedback loops;
- monitor-only effects on software path only.

## Track routing (spec vs implementation)

**Target domain** (`docs/specs/AUDIO-MONITOR-MIX.md`):

```ts
interface TrackRoutingState {
  monitorEnabled: boolean;
  transmitEnabled: boolean;
  recordArmed: boolean;
  muted: boolean;
  subscribed: boolean;
  volumeDb: number;
  pan: number;
}
```

**Current Audio Lab:** mute, solo, gain on local channels only — partial. Transmit, Record Arm, Subscribe not implemented until post-measurement slices.

**Mute ≠ Unsubscribe.** Mute silences a track in the local mix; unsubscribe stops receiving remote media.

## Per-participant monitor mix (ADR-017)

Each participant has independent `ParticipantViewState` for how they hear tracks. Changing Nicholas's monitor settings must not change Friend's mix.

## Effects

First effects (after local latency baseline):

- Gain
- Biquad EQ
- Compressor
- Distortion / WaveShaper
- Convolver reverb or simple algorithmic reverb
- Delay
- Stereo panner

Custom DSP goes in AudioWorklet. NAM/WASM is experimental FX only (ADR-019, ADR-008).

## Recording strategy

**Gate:** implement only after Audio Lab hardware benchmarks on target interfaces.

Stage 1:

`MediaStream -> MediaRecorder -> Blob`

Stage 2:

`AudioWorklet -> PCM -> Worker -> WAV encoder`

Dry tap before monitor FX. Keep both behind `AudioRecorder`.

## Audio Lab UI requirements

Display (decomposed):

- selected input / output devices;
- detected profile;
- channel count from `getSettings()`;
- channel meter per logical input;
- sample rate;
- **base latency**;
- **output latency** if available;
- local monitor path estimate (label partial if needed);
- monitoring state (software on/off);
- Direct Monitor hint (user-managed hardware);
- browser capability flags.

Actions:

- Start / Stop Audio
- Learn Input
- Configure inputs / refresh devices
- Export debug JSON for benchmarks

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

## Related docs

- `docs/DEVICE-COMPATIBILITY.md` — hardware test matrix
- `docs/research/2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md` — research conclusions
- `docs/specs/AUDIO-MONITOR-MIX.md` — full routing spec
