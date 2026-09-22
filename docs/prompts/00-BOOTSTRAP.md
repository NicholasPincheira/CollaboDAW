# Cursor Prompt 00 — Bootstrap

Read `AGENTS.md` and all relevant files under `docs/` and `.cursor/skills/` before making changes.

We are creating the MiniDAW Collaborative project.

Do not implement the complete DAW.

Bootstrap only the architecture and engineering workflow.

Tasks:

1. Initialize React + TypeScript + Vite.
2. Configure Tailwind CSS v4.
3. Configure GSAP.
4. Create a clean source structure that respects the domain boundaries in `docs/ARCHITECTURE.md`.
5. Create typed interfaces for:
   - AudioEngine
   - AudioDeviceManager
   - AudioDeviceProfileRegistry
   - ChannelMapper
   - AudioRecorder
   - EffectProcessor
   - MusicalTransport
   - SessionClock
   - ClockSynchronizer
   - RealtimeMediaProvider
   - SessionTransport
   - ProjectRepository
   - AssetStorage
6. Create initial adapters/placeholders without implementing external services.
7. Create test, lint, typecheck, and build scripts.
8. Add a minimal shell UI.
9. Add a diagnostics panel placeholder.
10. Do not add LiveKit or Supabase yet.
11. Do not implement WebRTC yet.
12. Do not implement recording yet.

Then run:

- typecheck
- lint
- tests
- build

Do not rewrite architecture in one large abstraction. Report:

- files created;
- dependencies added;
- architecture decisions;
- tests executed;
- any uncertainty.
