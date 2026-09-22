# Cursor Prompt 03 — Architecture Review

Review the current MiniDAW implementation as a senior audio/web systems engineer.

Read:

- AGENTS.md
- docs/ARCHITECTURE.md
- docs/AUDIO.md
- docs/DEVICE-COMPATIBILITY.md
- docs/DEVELOPMENT-WORKFLOW.md
- all relevant skills

Review for:

1. React/audio coupling.
2. Incorrect timing mechanisms.
3. Browser capability assumptions.
4. Device-channel assumptions.
5. Memory allocation in realtime paths.
6. UI rerender pressure.
7. Error handling.
8. Cleanup of streams, tracks, nodes, and contexts.
9. API feature detection.
10. Architecture boundaries.
11. Test coverage of deterministic logic.
12. Accidental vendor lock-in.

Do not refactor just because another style exists.

Only recommend or implement changes backed by a concrete issue.

For every finding include:

- severity;
- file/module;
- evidence;
- risk;
- minimal fix;
- whether a documentation/ADR update is needed.

After fixes, run typecheck, lint, tests, and build.
