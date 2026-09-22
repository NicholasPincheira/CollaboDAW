# MiniDAW / CollaboDAW — Documentation index

## Start here

| Doc | Purpose |
| --- | --- |
| [`../AGENTS.md`](../AGENTS.md) | Agent rules and implementation gate |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Layers, planes, routing model, build order |
| [`DECISIONS.md`](./DECISIONS.md) | ADR index |
| [`ROADMAP.md`](./ROADMAP.md) | Milestones and gates |

## Specifications (locked for MVP architecture)

| Doc | Topic |
| --- | --- |
| [`specs/LATENCY-TARGETS.md`](./specs/LATENCY-TARGETS.md) | Decomposed metrics and semaphores |
| [`specs/AUDIO-MONITOR-MIX.md`](./specs/AUDIO-MONITOR-MIX.md) | Per-participant mix, track states |
| [`specs/REMOTE-AUDIO-AND-COLLABORATION.md`](./specs/REMOTE-AUDIO-AND-COLLABORATION.md) | WebRTC media, control plane, click |
| [`specs/COLLAB-UX-CHECKLIST.md`](./specs/COLLAB-UX-CHECKLIST.md) | UX acceptance checklist |

## Research

| Doc | Status |
| --- | --- |
| [`research/2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md`](./research/2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md) | Final — architecture closed, empirics open |
| [`research/README.md`](./research/README.md) | How to add hardware benchmarks |

## ADR detail files

[`adr/README.md`](./adr/README.md) — ADR-017, ADR-018, ADR-019 (detailed rationale)

## Domain docs

- [`AUDIO.md`](./AUDIO.md)
- [`REALTIME.md`](./REALTIME.md)
- [`DEVICE-COMPATIBILITY.md`](./DEVICE-COMPATIBILITY.md)
- [`learn/README.md`](./learn/README.md) — quick concepts

## Implementation order

```text
docs → Audio Lab → hardware measure → recording → WebRTC
```

Do not skip to collaborative networking before local measurement on real interfaces.
