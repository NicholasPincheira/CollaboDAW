import { describe, expect, it } from "vitest";
import {
  classifyLocalMonitorPathMs,
  localMonitorBandLabel,
  softwareMonitorPathMs,
} from "./latency-bands.ts";

describe("latency bands (ADR-018)", () => {
  it("classifies local software monitor path bands", () => {
    expect(classifyLocalMonitorPathMs(null)).toBe("unmeasured");
    expect(classifyLocalMonitorPathMs(8)).toBe("excellent");
    expect(classifyLocalMonitorPathMs(12)).toBe("target");
    expect(classifyLocalMonitorPathMs(18)).toBe("acceptable");
    expect(classifyLocalMonitorPathMs(25)).toBe("high");
    expect(classifyLocalMonitorPathMs(76)).toBe("outside");
  });

  it("sums base+output as partial path ms", () => {
    expect(softwareMonitorPathMs(0.01, 0.065)).toBeCloseTo(75, 5);
    expect(softwareMonitorPathMs(null, null)).toBeNull();
    expect(softwareMonitorPathMs(0.01, null)).toBeCloseTo(10, 5);
  });

  it("labels bands for diagnostics UI", () => {
    expect(localMonitorBandLabel("target")).toContain("TARGET");
    expect(localMonitorBandLabel("outside")).toContain("OUTSIDE");
  });
});
