# Research reports

## Status (2026-09-21)

| Topic | Document | Architecture | Empirical validation |
| --- | --- | --- | --- |
| Latency, monitoring, collaboration | [`2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md`](./2026-09-21-LATENCY-AUDIO-MONITORING-FINAL.md) | **Closed** | **Open** — run hardware benchmarks |
| Hardware run template | [`HARDWARE-BENCHMARK-TEMPLATE.md`](./HARDWARE-BENCHMARK-TEMPLATE.md) | — | Fill after Audio Lab export |

Architecture decisions from this report are integrated into `docs/specs/`, `docs/DECISIONS.md` (ADR-017–019), and core architecture docs.

Empirical validation means measuring on **your** UMC22 / iTrack Solo / Scarlett Solo with Chromium and recording results here or via debug JSON exports.

## Workflow for new measurements

1. Run Audio Lab on target hardware (IA assist = **off**).
2. Diagnostics → **Copy benchmark JSON**.
3. Copy [`HARDWARE-BENCHMARK-TEMPLATE.md`](./HARDWARE-BENCHMARK-TEMPLATE.md) → `YYYY-MM-DD-<interface>-benchmark.md`.
4. Paste JSON + subjective feel 1–5.
5. Update specs only if measurements change targets or reveal browser limits.

## Prior prompts

- `docs/prompts/05-LATENCY-IA-RESEARCH.md` — exploratory GPT prompt (superseded for decisions by final report above).
