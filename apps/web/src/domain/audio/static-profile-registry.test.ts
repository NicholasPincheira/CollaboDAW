import { describe, expect, it } from "vitest";
import { StaticAudioDeviceProfileRegistry } from "./static-profile-registry.ts";

const registry = new StaticAudioDeviceProfileRegistry();

describe("StaticAudioDeviceProfileRegistry", () => {
  it("resolves the four target interfaces from driver-style labels", () => {
    expect(registry.resolve("Microphone (Focusrite iTrack Solo)")?.id).toBe("focusrite-itrack-solo");
    expect(registry.resolve("Focusrite USB Scarlett Solo 3rd Gen")?.id).toBe(
      "focusrite-scarlett-solo-3rd",
    );
    expect(registry.resolve("Focusrite Scarlett Solo 4th Gen")?.id).toBe(
      "focusrite-scarlett-solo-4th",
    );
    expect(registry.resolve("Microphone (Behringer UMC22)")?.id).toBe("behringer-umc22");
    expect(registry.resolve("Line (UMC-22)")?.id).toBe("behringer-umc22");
  });

  it("does not guess a Scarlett generation or a nearby Behringer model", () => {
    expect(registry.resolve("Scarlett Solo")).toBeNull();
    expect(registry.resolve("UMC202")).toBeNull();
    expect(registry.resolve("USB Audio Device")).toBeNull();
  });

  it("keeps 4th Gen channel indexes undiscovered", () => {
    const profile = registry.resolve("Scarlett Solo fourth gen");
    expect(profile?.channelOrder).toBe("runtime");
    expect(profile?.defaultInputs.every((input) => input.channelIndex === null)).toBe(true);
  });
});
