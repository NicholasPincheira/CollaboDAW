# Hardware benchmark template

Copy this file to `docs/research/YYYY-MM-DD-<interface>-benchmark.md` after a run.

Fill from **Diagnostics → Copy debug JSON** plus your subjective notes.

---

## Meta

| Field | Value |
| --- | --- |
| Date | |
| Operator | |
| OS | Windows 10 / 11 · build |
| Browser | Chrome / Edge · version |
| Interface | UMC22 / iTrack Solo / Scarlett Solo 3rd / 4th |
| Driver notes | |
| AI mode | **off** (required for baseline) |

## Devices (from app)

| Field | Value |
| --- | --- |
| Input label | |
| Output label (primary) | |
| Dual / secondary | off / … |
| Profile resolved | |
| `getSettings` channelCount | |
| Sample rate Hz | |

## Latency (browser-observed)

| Metric | Value | Notes |
| --- | --- | --- |
| baseLatencyMs | | |
| outputLatencyMs | | |
| localMonitorPathMs (base+out) | | **partial** — not instrument→ear |
| ADR-018 band | excellent / target / acceptable / high / **outside** | |
| Direct Monitor HW | ON / OFF | user-managed on interface |
| Software monitor | ON / OFF | |

## Configurations tested

| # | Experience preset | latencyHint | SR | Primary out | Direct Mon | Soft mon | pathMs | feel 1–5 | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | feel | live | 48k | interface | ON | OFF | | | |
| 2 | feel | live | 48k | interface | OFF | ON | | | |
| 3 | monitor-sw | live | 48k | interface | OFF | ON | | | |
| 4 | feel | live | 48k | Realtek | — | ON | | | compare |
| 5 | capture | record | 48k | interface | ON | OFF | | | |

## Subjective

Best feel overall: _______________

Feedback / double-monitor issues? _______________

## Debug JSON

Paste or attach export from **Copy debug JSON** below (or link gist).

```json

```

## Gate checklist

- [ ] AI = off for all baseline rows
- [ ] Primary output = interface for rows 1–3
- [ ] At least one interface from the target list measured
- [ ] pathMs band recorded even if OUTSIDE TARGET
