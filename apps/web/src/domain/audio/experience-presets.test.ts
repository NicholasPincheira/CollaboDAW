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
  listPresetsByGroup,
} from "./experience-presets.ts";

describe("experience presets", () => {
  it("exposes play presets plus A/B feel-test presets", () => {
    expect(listPresetsByGroup("play").map((p) => p.id)).toEqual(["feel", "monitor-sw", "capture"]);
    expect(listPresetsByGroup("ab").map((p) => p.id)).toEqual(["ab-direct", "ab-software"]);
    expect(EXPERIENCE_PRESETS).toHaveLength(5);
  });

  it("defaults to HW Direct (feel id) with AI off for A/B baseline", () => {
    expect(DEFAULT_EXPERIENCE_PRESET_ID).toBe("feel");
    expect(DEFAULT_AI_ASSIST_MODE).toBe("off");
    const feel = getExperiencePreset("feel");
    expect(feel.shortLabel).toBe("HW Direct");
    expect(feel.audio.softwareMonitoring).toBe(false);
    expect(feel.audio.latencyMode).toBe("live");
    expect(feel.strategy.preferHardwareDirectMonitor).toBe(true);
  });

  it("keeps A/B Direct and Soft settings opposite and forces AI off", () => {
    const direct = getExperiencePreset("ab-direct");
    const soft = getExperiencePreset("ab-software");
    expect(direct.audio.softwareMonitoring).toBe(false);
    expect(direct.hardwareDirectMonitor).toBe("on");
    expect(direct.forceAiOff).toBe(true);
    expect(soft.audio.softwareMonitoring).toBe(true);
    expect(soft.hardwareDirectMonitor).toBe("off");
    expect(soft.forceAiOff).toBe(true);
  });

  it("keeps Web Mon and Capture settings distinct", () => {
    const monitor = getExperiencePreset("monitor-sw");
    const capture = getExperiencePreset("capture");
    expect(monitor.shortLabel).toBe("Web Mon");
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
    expect(isExperiencePresetId("ab-direct")).toBe(true);
    expect(isExperiencePresetId("nope")).toBe(false);
    expect(isAiAssistMode("off")).toBe(true);
    expect(isAiAssistMode("magic")).toBe(false);

    const notices = buildExperienceNotices(getExperiencePreset("ab-software"), "off");
    expect(notices[0]).toContain("A/B Soft");
    expect(notices.some((line) => line.includes("Software monitor: ON"))).toBe(true);
    expect(notices.some((line) => line.includes("IA assist: off"))).toBe(true);
  });
});
