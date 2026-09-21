# Cursor Prompt 02 — Hardware Profiles

Read `AGENTS.md`, `docs/DEVICE-COMPATIBILITY.md`, and the `device-compatibility` skill.

Implement the hardware profile system.

Create a registry that can resolve:

- Focusrite iTrack Solo
- Focusrite Scarlett Solo 3rd Gen
- Focusrite Scarlett Solo 4th Gen
- Behringer UMC22

Requirements:

1. Profiles must be data/configuration, not scattered conditionals.
2. Each profile contains default logical input/output mappings and explanatory notes.
3. Runtime capabilities are authoritative.
4. The profile may provide a default channel order, but runtime validation can change the actual mapping.
5. Unknown devices fall back to a generic profile.
6. Add manual channel mapping.
7. Add a "Learn Input" experiment that detects which exposed channel receives a test signal.
8. Save user overrides separately from vendor defaults.
9. Make detection resilient to harmless device-label variations.
10. Add unit tests for profile matching and mapping.

Do not claim physical hardware identity from signal detection. The "Learn Input" result means "the exposed browser channel receiving the signal".

Do not add vendor SDKs.

Run typecheck, lint, tests, and build.
