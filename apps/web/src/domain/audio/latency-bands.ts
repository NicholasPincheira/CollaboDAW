/**
 * ADR-018 local software-monitor bands.
 * Engineering targets — not universal perception laws.
 */
export type LocalMonitorBand =
  | "excellent"
  | "target"
  | "acceptable"
  | "high"
  | "outside"
  | "unmeasured";

export function classifyLocalMonitorPathMs(pathMs: number | null): LocalMonitorBand {
  if (pathMs === null || !Number.isFinite(pathMs)) return "unmeasured";
  if (pathMs < 10) return "excellent";
  if (pathMs <= 15) return "target";
  if (pathMs <= 20) return "acceptable";
  if (pathMs <= 30) return "high";
  return "outside";
}

export function localMonitorBandLabel(band: LocalMonitorBand): string {
  switch (band) {
    case "excellent":
      return "EXCELLENT (<10 ms)";
    case "target":
      return "TARGET (10–15 ms)";
    case "acceptable":
      return "ACCEPTABLE / EXPERIMENTAL (15–20 ms)";
    case "high":
      return "HIGH (20–30 ms)";
    case "outside":
      return "OUTSIDE TARGET (>30 ms)";
    case "unmeasured":
      return "not measured";
  }
}

/** Partial software path: base + output. Not instrument→ear. */
export function softwareMonitorPathMs(
  baseLatencySeconds: number | null,
  outputLatencySeconds: number | null,
): number | null {
  if (baseLatencySeconds === null && outputLatencySeconds === null) return null;
  return ((baseLatencySeconds ?? 0) + (outputLatencySeconds ?? 0)) * 1000;
}
