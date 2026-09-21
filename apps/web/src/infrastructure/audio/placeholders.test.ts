import { describe, expect, it } from "vitest";
import { UnimplementedCapabilityError } from "../../domain/errors.ts";
import { BypassEffectProcessor } from "./bypass-effect-processor.ts";
import { PlaceholderAudioDeviceManager } from "./placeholder-audio-device-manager.ts";
import { PlaceholderAudioEngine } from "./placeholder-audio-engine.ts";
import { UnimplementedAudioRecorder } from "./unimplemented-audio-recorder.ts";

describe("audio placeholders", () => {
  it("reports idle audio without fabricating latency", async () => {
    const engine = new PlaceholderAudioEngine();
    expect(engine.state).toBe("idle");
    expect(engine.getDiagnostics()).toEqual({
      sampleRate: null,
      baseLatencySeconds: null,
      outputLatencySeconds: null,
      inputChannelCount: null,
    });
    await expect(engine.start()).rejects.toBeInstanceOf(UnimplementedCapabilityError);
  });

  it("stores a selection without enumerating a browser device", async () => {
    const devices = new PlaceholderAudioDeviceManager();
    await expect(devices.enumerate()).resolves.toEqual([]);
    devices.selectInput("input-1");
    devices.selectOutput("output-1");
    expect(devices.getSelection()).toEqual({
      inputDeviceId: "input-1",
      outputDeviceId: "output-1",
    });
  });

  it("refuses to record", async () => {
    const recorder = new UnimplementedAudioRecorder();
    expect(recorder.capability).toBe("unavailable");
    await expect(recorder.start()).rejects.toBeInstanceOf(UnimplementedCapabilityError);
    await expect(recorder.stop()).rejects.toBeInstanceOf(UnimplementedCapabilityError);
  });

  it("starts effects bypassed", () => {
    const effect = new BypassEffectProcessor("eq-1", "eq");
    expect(effect.getBypass()).toBe(true);
    effect.setBypass(false);
    expect(effect.getBypass()).toBe(false);
  });
});
