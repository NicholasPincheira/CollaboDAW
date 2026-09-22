import { describe, expect, it } from "vitest";
import {
  AI_ASSIST_OPTIONS,
  DEFAULT_AI_ASSIST_MODE,
  DEFAULT_EXPERIENCE_PRESET_ID,
  EXPERIENCE_PRESETS,
  buildExperienceNotices,
  getAiAssistOption,
  getExperiencePreset,
  isAiAssistMode,
  isExperiencePresetId,
} from "./experience-presets.ts";

describe("experience presets", () => {
  it("exposes exactly three distinguishable presets", () => {
    expect(EXPERIENCE_PRESETS).toHaveLength(3);
    expect(EXPERIENCE_PRESETS.map((p) => p.id)).toEqual(["feel", "monitor-sw", "capture"]);
  });

  it("defaults to Feel with AI off for A/B baseline", () => {
    expect(DEFAULT_EXPERIENCE_PRESET_ID).toBe("feel");
    expect(DEFAULT_AI_ASSIST_MODE).toBe("off");
    const feel = getExperiencePreset("feel");
    expect(feel.audio.softwareMonitoring).toBe(false);
    expect(feel.audio.latencyMode).toBe("live");
    expect(feel.strategy.preferHardwareDirectMonitor).toBe(true);
  });

  it("keeps Monitor SW and Capture settings distinct", () => {
    const monitor = getExperiencePreset("monitor-sw");
    const capture = getExperiencePreset("capture");
    expect(monitor.audio.softwareMonitoring).toBe(true);
    expect(monitor.audio.latencyMode).toBe("live");
    expect(capture.audio.softwareMonitoring).toBe(false);
    expect(capture.audio.latencyMode).toBe("record");
    expect(capture.strategy.prioritizeDryRecordTap).toBe(true);
  });

  it("lists AI options with off as the only ready mode", () => {
    expect(AI_ASSIST_OPTIONS.map((o) => o.id)).toEqual(["off", "remote-plc", "experimental"]);
    expect(getAiAssistOption("off").status).toBe("ready");
    expect(getAiAssistOption("remote-plc").status).toBe("inactive-stub");
    expect(getAiAssistOption("experimental").status).toBe("inactive-stub");
  });

  it("validates ids and builds notices including AI status", () => {
    expect(isExperiencePresetId("feel")).toBe(true);
    expect(isExperiencePresetId("nope")).toBe(false);
    expect(isAiAssistMode("off")).toBe(true);
    expect(isAiAssistMode("magic")).toBe(false);

    const notices = buildExperienceNotices(getExperiencePreset("feel"), "remote-plc");
    expect(notices[0]).toContain("Feel");
    expect(notices.some((line) => line.includes("Remote PLC"))).toBe(true);
    expect(notices.some((line) => line.includes("not active"))).toBe(true);
  });
});
