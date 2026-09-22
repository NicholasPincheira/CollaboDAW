# Cursor Prompt 01 — Audio Lab

Read `AGENTS.md`, `docs/AUDIO.md`, `docs/DEVICE-COMPATIBILITY.md`, and the `audio-realtime` and `device-compatibility` skills.

Implement the first real vertical slice: Audio Lab.

Requirements:

1. Enumerate audio input/output devices.
2. Implement permission flow.
3. Re-enumerate devices after permission.
4. Create an input selection UI.
5. Create `getUserMedia()` capture for the selected device.
6. Request two input channels when appropriate, but inspect actual settings afterward.
7. Build an AudioContext using an interactive/low-latency hint where appropriate.
8. Create a MediaStreamAudioSourceNode.
9. Split channels when multiple channels are actually exposed.
10. Expose one meter per logical channel.
11. Monitor selected input safely.
12. Expose sample rate.
13. Expose base latency.
14. Expose output latency when supported.
15. Enumerate/select output device when supported.
16. Provide graceful fallback to default output when independent sink selection is unavailable.
17. Stop the stream and AudioContext cleanly.
18. Handle permission denial, device disappearance, invalid device IDs, and suspended AudioContext.

Do not add realtime collaboration.
Do not add Supabase.
Do not add LiveKit.
Do not implement the full DAW timeline.

Acceptance test:

- Use a Focusrite iTrack Solo and identify two usable logical channels when the browser exposes them.
- Use a Behringer UMC22 and identify its two logical inputs when the browser exposes them.
- Unknown multichannel devices remain usable through generic mapping.

At the end, run typecheck, lint, tests, and build. Update `docs/ROADMAP.md` and `docs/DEVICE-COMPATIBILITY.md` with any observed limitation discovered during implementation.
