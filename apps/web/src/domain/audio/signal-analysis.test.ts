import { describe, expect, it } from "vitest";
import { measurePeak, pickStrongestChannel } from "./signal-analysis.ts";
import { applyChannelMapOverrides } from "./channel-mapping-overrides.ts";
import type { ChannelMapEntry } from "./channel-mapper.ts";

describe("signal analysis", () => {
  it("measures the absolute peak without allocating", () => {
    expect(measurePeak(new Float32Array([0.1, -0.4, 0.2]))).toBeCloseTo(0.4);
  });

  it("ignores channels below the noise floor when learning", () => {
    expect(pickStrongestChannel([0.01, 0.015, 0.01])).toBeNull();
    expect(pickStrongestChannel([0.01, 0.2, 0.05])).toBe(1);
  });
});

describe("channel mapping overrides", () => {
  it("keeps vendor defaults when no override exists", () => {
    const base: ChannelMapEntry[] = [
      { streamChannel: 0, label: "Microphone", type: "microphone", source: "profile-default" },
      { streamChannel: 1, label: "Guitar / Instrument", type: "instrument", source: "profile-default" },
    ];
    expect(applyChannelMapOverrides(base, null)).toEqual(base);
  });

  it("applies learned and manual overrides by label without mutating the base", () => {
    const base: ChannelMapEntry[] = [
      { streamChannel: null, label: "Microphone", type: "microphone", source: "profile-default" },
      { streamChannel: null, label: "Instrument / Line", type: "instrument", source: "profile-default" },
    ];
    const overrides: ChannelMapEntry[] = [
      { streamChannel: 1, label: "Microphone", type: "microphone", source: "learned" },
      { streamChannel: 0, label: "Instrument / Line", type: "instrument", source: "manual" },
    ];
    const next = applyChannelMapOverrides(base, overrides);
    expect(next).toEqual(overrides);
    expect(base[0]?.streamChannel).toBeNull();
  });
});
