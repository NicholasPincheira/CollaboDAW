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

## Interpretation

1. **Cuello principal:** `outputLatencyMs` (~54–56), not sample rate (44.1 vs 48 almost identical).
2. **baseLatencyMs = 10** is already in the ADR-018 preferred zone for that segment alone.
3. **64 ms software path** is not “acceptable” vs ADR-018 for *software* monitoring of instruments — but **Direct Monitor hardware** can still feel good because that path bypasses the browser. Subjective feel with Direct Monitor ON + software OFF was not scored in the JSON (`subjectiveFeel1to5: null`).
4. Both exports show `experiencePresetId: "feel"` with **`softwareMonitor: true`**. Feel should leave software monitor **off**. Likely re-enabled after preset, or toggled in Audio Lab — re-run Feel and confirm mon = off for the Direct Monitor row.
5. Auto-tune best: `live @ 48000` → 64 ms (vs record 65 ms). Negligible SR difference.

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
| AI off baseline | ✅ (run B) |
| ADR-018 local <15 ms software | ❌ not met on this OS/browser/driver |
| Subjective 1–5 Direct Mon vs Soft Mon | ⏳ pending operator |
| Profile auto-resolve | ❌ fixed in code follow-up (WDM label) |

**Architecture decision:** proceed to **Slice 3 (dry recording)** without waiting for <15 ms software path. Product path for playing feel remains **Direct Monitor + software off**; software path stays a measured diagnostic, not the jam default.

Raw JSON: session `fbd54d0a-eb0d-4cce-a11c-c53cffaa1937` (two exports pasted in chat 2026-09-21).
