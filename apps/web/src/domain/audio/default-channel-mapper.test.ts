import { describe, expect, it } from "vitest";
import { DefaultChannelMapper } from "./default-channel-mapper.ts";
import { StaticAudioDeviceProfileRegistry } from "./static-profile-registry.ts";

const mapper = new DefaultChannelMapper();
const registry = new StaticAudioDeviceProfileRegistry();

describe("DefaultChannelMapper", () => {
  it("uses advisory indexes only when the stream exposes them", () => {
    const profile = registry.resolve("Focusrite iTrack Solo");
    const map = mapper.build({ profile, exposedChannelCount: 2 });
    expect(map.mode).toBe("known-profile");
    expect(map.requiresRuntimeValidation).toBe(true);
    expect(map.entries.map((entry) => [entry.streamChannel, entry.label])).toEqual([
      [0, "Microphone"],
      [1, "Guitar / Instrument"],
    ]);
  });

  it("does not copy 3rd Gen indexes onto a 4th Gen profile", () => {
    const profile = registry.resolve("Scarlett Solo 4th Gen");
    const map = mapper.build({ profile, exposedChannelCount: 2 });
    expect(map.entries.every((entry) => entry.streamChannel === null)).toBe(true);
    expect(map.entries.map((entry) => entry.label)).toEqual(["Microphone", "Instrument / Line"]);
  });

  it("reports limited capture when the browser exposes fewer channels", () => {
    const profile = registry.resolve("Behringer UMC22");
    const map = mapper.build({ profile, exposedChannelCount: 1 });
    expect(map.mode).toBe("limited-capture");
    expect(map.entries).toEqual([
      {
        streamChannel: 0,
        label: "Mic / Line",
        type: "microphone",
        source: "profile-default",
      },
    ]);
  });

  it("falls back to generic channels for an unknown device", () => {
    const map = mapper.build({ profile: null, exposedChannelCount: 2 });
    expect(map.mode).toBe("generic-multichannel");
    expect(map.entries.map((entry) => entry.label)).toEqual(["Input 1", "Input 2"]);
  });

  it("shows profile labels before a stream exists without inventing runtime order", () => {
    const profile = registry.resolve("Scarlett Solo 4th Gen");
    const map = mapper.build({ profile, exposedChannelCount: null });
    expect(map.mode).toBe("unmeasured");
    expect(map.entries.map((entry) => entry.label)).toEqual(["Microphone", "Instrument / Line"]);
    expect(map.entries.every((entry) => entry.streamChannel === null)).toBe(true);
  });

  it("does not invent channels for an unknown device before a stream exists", () => {
    const map = mapper.build({ profile: null, exposedChannelCount: null });
    expect(map.mode).toBe("unmeasured");
    expect(map.entries).toEqual([]);
  });
});
