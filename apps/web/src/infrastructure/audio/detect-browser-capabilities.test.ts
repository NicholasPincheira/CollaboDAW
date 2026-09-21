import { describe, expect, it } from "vitest";
import { detectBrowserAudioCapabilities } from "./detect-browser-capabilities.ts";

describe("detectBrowserAudioCapabilities", () => {
  it("reports missing APIs without inventing support", () => {
    const caps = detectBrowserAudioCapabilities({
      navigator: {},
    } as Window & typeof globalThis);
    expect(caps.mediaDevices).toBe(false);
    expect(caps.getUserMedia).toBe(false);
    expect(caps.audioContext).toBe(false);
    expect(caps.setSinkId).toBe(false);
    expect(caps.outputLatency).toBe(false);
  });
});
