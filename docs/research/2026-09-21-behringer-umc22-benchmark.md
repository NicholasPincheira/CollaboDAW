# Hardware benchmark — Behringer UMC22 (WDM)

**Date:** 2026-09-21 (export UTC 2026-09-22)  
**Operator:** project owner  
**OS:** Windows 10  
**Browser:** Edge 153 / Chromium 153  
**Interface:** Behringer (driver label `BEHRINGER USB WDM AUDIO 2.8.40` — UMC22 class)  
**AI baseline:** second export uses `off` (valid); first had `experimental` (stub only — ignore for latency)

## Summary

| Metric | Run A (44.1k) | Run B + auto-tune (48k) |
| --- | --- | --- |
| baseLatencyMs | 10 | 10 |
| outputLatencyMs | 56 | 54–56 |
| **localMonitorPathMs** | **66** | **64** (best) |
| ADR-018 band | **outside** (>30) | **outside** |
| Primary I/O | Behringer in + out | Behringer in + out ✅ |
| sinkStatus | applied | applied |
| Control RTT | — | ~54 ms · jitter ~0.6 · loss 0% |
| Profile resolved | **null** (label lacks `UMC22`) | null |

Previous software path was ~75–80 ms (often Realtek out). With **output = Behringer**, path dropped to **~64–66 ms** (~10–15 ms improvement). Still **outside** the ADR-018 local software-monitor target (**<15 ms** preferred).

## A/B Soft run (2026-09-22)

| Metric | Soft (`ab-software`) |
| --- | --- |
| localMonitorPathMs | **70** (base 10 + out 60) |
| Band | **outside** |
| subjectiveFeel1to5 | **1 / 5** |
| softwareMonitor | true |
| secondary | off |
| Auto-tune best | live @ 48k → **69 ms** (44.1k same; record ~70) |

**Operator note:** Soft scored **1/5**. HW Direct (clean) operator reports **~5/5** (hardware path — expected). Formal JSON for ① still optional if scored in-app after selecting **① Direct**.

## Interpretation

1. **Cuello principal:** `outputLatencyMs` (~54–60), not sample rate (44.1 vs 48 almost identical).
2. **baseLatencyMs = 10** is already in the ADR-018 preferred zone for that segment alone.
3. **64–70 ms software path** is outside ADR-018 for *software* monitoring — expected on this stack. Jam feel product path remains **HW Direct + software off**.
4. Soft scored **1/5** when delayed (and worse if doubled with HW Direct). Still need a clean **① HW Direct** score (Mon off + Direct ON) for the A/B pair.
5. Auto-tune cannot break ~69 ms here — do not block Slice 3 on sub-40 ms software.

## Config notes from exports

```text
Input:  Línea de entrada (2- BEHRINGER USB WDM AUDIO 2.8.40)
Output: Altavoces (2- BEHRINGER USB WDM AUDIO 2.8.40)
Channels: 2
```

## Gate decision (Slice 2)

| Criterion | Status |
| --- | --- |
| Target interface exercised | ✅ Behringer / UMC22 class |
| I/O aligned to interface | ✅ |
| Decomposed metrics captured | ✅ |
| AI off baseline | ✅ |
| ADR-018 local <15 ms software | ❌ not met (~64–70 ms) |
| Subjective Soft (②) | ✅ **1/5** @ ~70 ms |
| Subjective HW Direct (①) | ✅ **5/5** (instant HW path; operator confirmed) |
| Profile auto-resolve | ✅ WDM matchers |

**Architecture decision:** Slice 2 closed 2026-09-22. Product path for playing = **HW Direct**; software path = diagnostic / future Web FX. Proceed to **Slice 3 (dry recording)**.

Raw JSON: session `fbd54d0a-eb0d-4cce-a11c-c53cffaa1937` (Soft export 2026-09-22T03:10Z + HW Direct score 5).
