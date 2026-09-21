# Audio Device Compatibility and Hardware Profiles

## Compatibility strategy

The browser should support three levels:

### Level A — Known hardware profile

The registry recognizes the model and provides a default channel map and UI hints.

### Level B — Generic multichannel

The browser exposes multiple channels but the model is unknown. The user maps channels manually.

### Level C — Limited capture

The browser only exposes a limited logical input. The UI explains the limitation instead of pretending physical separation exists.

## Detection pipeline

```text
enumerateDevices()
   ↓
Permission / device labels
   ↓
Normalize device identity
   ↓
ProfileRegistry.resolve()
   ├── known profile
   └── generic profile
   ↓
Create channel map
   ↓
getUserMedia()
   ↓
getSettings()
   ↓
Validate actual capabilities
```

## Profile model

```ts
interface AudioHardwareProfile {
  id: string;
  manufacturer: string;
  model: string;
  variants?: string[];
  matchers: HardwareMatcher[];
  defaultInputs: AudioInputProfile[];
  defaultOutputs: AudioOutputProfile[];
  notes: string[];
}

interface AudioInputProfile {
  channelIndex: number;
  label: string;
  type: "microphone" | "instrument" | "line" | "stereo" | "unknown";
  preferredFor?: "vocal" | "guitar" | "bass" | "line";
  phantomPowerAvailable?: boolean;
  instrumentModeAvailable?: boolean;
}
```

## "Learn Input" feature

For unknown or ambiguous devices:

1. User chooses a logical role.
2. App listens for a signal.
3. App identifies the strongest channel.
4. User confirms.
5. Mapping is saved as a user profile.

This must not claim electrical input identity; it is a user-defined signal mapping.

## Target hardware

### Focusrite iTrack Solo

Physical/use-case facts to encode as a default profile:

- Designed around microphone and guitar/instrument recording.
- Two physical audio inputs are the relevant DAW capture sources.
- Focusrite provides Windows driver support for iTrack Solo.
- Treat the profile as a default mapping; verify actual browser channel exposure at runtime.

Suggested initial logical mapping:

```text
Channel 0 → Microphone
Channel 1 → Guitar / Instrument
```

### Focusrite Scarlett Solo 3rd Gen

Focusrite documents 2 x 2 simultaneous I/O and separate microphone and instrument/line input capabilities.

Suggested default mapping:

```text
Channel 0 → Microphone
Channel 1 → Guitar / Instrument
```

### Focusrite Scarlett Solo 4th Gen

Do not blindly reuse the 3rd Gen mapping. Focusrite's current guide documents distinct microphone and instrument/line inputs and system-level channel behavior that should be verified at runtime.

Suggested product-level logical mapping:

```text
One channel → Microphone
One channel → Instrument / Line
```

The actual browser channel order must be discovered and mapped by the profile plus runtime verification.

### Behringer UMC22

Official product documentation describes a 2 x 2, 48 kHz USB audio interface with:

- MIC/LINE 1 combination input;
- INST 2 input;
- two outputs;
- direct monitoring.

Suggested mapping:

```text
Channel 0 → Mic / Line
Channel 1 → Instrument
```

## UI behavior

Known profile:

```text
Device: Behringer UMC22
Profile: UMC22
Confidence: High

Input 1  Mic / Line
Input 2  Instrument
```

Unknown:

```text
Device: USB Audio Device
Profile: Generic multichannel
Detected channels: 2

Input 1  [ Microphone ▼ ]
Input 2  [ Guitar ▼ ]

[ Save profile ]
```

## Output compatibility

The application should enumerate outputs when allowed and select them when supported.

If `AudioContext.setSinkId()` is unavailable, fall back to the default output or an HTML media element sink where appropriate.

Never make independent output routing a hard requirement for the MVP.

## Implementation notes (Audio Lab, 2026-09-21)

- Profile matchers live in `apps/web/src/domain/audio/known-profiles.ts` as data.
- User overrides persist in `localStorage` under `minidaw.channel-map.*` and never overwrite vendor defaults in code.
- Scarlett Solo 4th Gen keeps `channelOrder: "runtime"` so 3rd Gen indexes are not copied blindly.
- If Chrome exposes only one channel for a 2-input interface, the UI marks `limited-capture` instead of inventing a second physical input.

## Test matrix

For each device/browser combination record:

- OS
- browser/version
- device label
- detected input channels
- detected output devices
- sample rate
- `baseLatency`
- `outputLatency` when available
- getUserMedia success/failure
- channel splitting result
- monitoring success
- output routing success/failure
- notes
