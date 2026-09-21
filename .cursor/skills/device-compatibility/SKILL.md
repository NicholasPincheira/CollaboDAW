---
name: device-compatibility
description: Detect browser audio devices, create hardware profiles, map multichannel interfaces, implement manual input mapping, and validate Focusrite/Behringer compatibility for MiniDAW.
---

# Device Compatibility Skill

## Objectives

Make physical audio interfaces usable even when browser/Windows device naming and channel exposure differ.

## Mandatory sequence

1. `enumerateDevices()`.
2. Request permission when needed.
3. Enumerate again.
4. Resolve known profile by normalized label/matcher.
5. Create `getUserMedia()` stream.
6. Inspect actual `MediaStreamTrack.getSettings()`.
7. Validate channel count.
8. Build channel map.
9. Allow manual remapping.
10. Persist user overrides separately from vendor defaults.

## Known profiles

### iTrack Solo

Default conceptual mapping:

- channel 0 -> microphone
- channel 1 -> guitar/instrument

### Scarlett Solo 3rd Gen

Default conceptual mapping:

- microphone channel
- instrument/line channel

Do not assume browser channel order solely from the physical panel.

### Scarlett Solo 4th Gen

Treat channel order as runtime-discoverable. Profile stores physical/logical intent, while runtime validation determines exposed ordering.

### UMC22

Default conceptual mapping:

- channel 0 -> mic/line
- channel 1 -> instrument

## Learn Input

Use signal detection only as a convenience to identify which exposed channel receives a signal. Call it a learned signal mapping, not hardware truth.

## Unknown devices

Never block the user because a product is unknown. Fall back to generic multichannel mode.

## Testing

Record a compatibility result including:

- browser/version;
- OS;
- device label;
- channel count;
- sample rate;
- latency values;
- channel map;
- output routing support;
- notes.
