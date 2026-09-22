# Cursor Prompt — Integrar nueva investigación de latencia y monitoreo

**Status:** integration completed 2026-09-21. Use this prompt as reference for future doc-only reconciliations.

Lee primero, en este orden:

1. `AGENTS.md`
2. `docs/ARCHITECTURE.md`
3. `docs/AUDIO.md`
4. `docs/REALTIME.md`
5. `docs/DEVICE-COMPATIBILITY.md`
6. `docs/research/2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md`
7. `docs/specs/LATENCY-TARGETS.md`
8. `docs/specs/AUDIO-MONITOR-MIX.md`
9. `docs/specs/REMOTE-AUDIO-AND-COLLABORATION.md`
10. `docs/adr/ADR-017-PER-PARTICIPANT-MONITOR-MIX.md`
11. `docs/adr/ADR-018-LATENCY-TARGETS.md`
12. `docs/adr/ADR-019-AI-IS-ORTHOGONAL-TO-LATENCY.md`

## Objetivo

Integrar estas decisiones en la documentación existente sin romper la arquitectura ya definida.

## No implementes código todavía

No:

- instales LiveKit;
- instales Supabase adicional;
- implementes WebRTC;
- agregues IA;
- rehagas el Audio Lab;
- cambies React UI;
- cambies el formato de proyectos.

## Tareas

1. Comparar estas nuevas especificaciones con los documentos existentes.
2. Detectar contradicciones reales.
3. Si existe contradicción, explicar exactamente cuál y qué ADR prevalece.
4. Actualizar `docs/AUDIO.md`, `docs/REALTIME.md` y `docs/ARCHITECTURE.md` sólo donde las nuevas decisiones agreguen precisión necesaria.
5. Actualizar `docs/DECISIONS.md` con referencias a ADR-017, ADR-018 y ADR-019.
6. Mantener intacta la arquitectura modular y los adapters.
7. No mover lógica hacia React.
8. Añadir referencias a las fuentes en los documentos cuando corresponda.
9. No inventar capabilities de browsers ni de interfaces.

## Decisiones que deben quedar explícitas

### Audio routing

Cada track separa:

- `Monitor`
- `Transmit`
- `Record Arm`
- `Mute`
- `Subscribe/Receive`

### Per-user mix

La mezcla de Nicholas y Friend es independiente.

### Latency

No existe un único `latencyMs`. Local **<15 ms** preferred; remote one-way **<=30 ms**.

### Remote audio

WebRTC = media. WebSocket/realtime = control.

### Click

Generado localmente usando SessionClock.

### AI

Default OFF. Neural PLC y NAM son experimentos independientes del preset de latencia.

## Next implementation slice

**Audio Lab hardware benchmarks** on UMC22 / iTrack Solo / Scarlett Solo — not WebRTC, not recording.
