/**
 * High-level jam/experience presets that combine latency-improving options.
 * Orthogonal to low-level AudioContext latencyHint modes — presets apply a coherent bundle.
 *
 * AI assist is intentionally separate so players can A/B with/without it.
 * `ab-*` presets are for subjective feel scoring (Slice 2).
 */
export type ExperiencePresetId =
  | "feel"
  | "monitor-sw"
  | "capture"
  | "ab-direct"
  | "ab-software";

/** Mirrors AudioContext latencyHint presets used by the lab engine. */
export type ExperienceLatencyMode = "live" | "record" | "rehearsal" | "mix";

/** Extensible AI assist modes. Inactive stubs until media/DSP slices land. */
export type AiAssistMode = "off" | "remote-plc" | "experimental";

export type ExperiencePresetGroup = "play" | "ab";

export type HardwareDirectMonitorHint = "on" | "off" | "optional";

export type SubjectiveFeelScore = 1 | 2 | 3 | 4 | 5;

export interface ExperiencePresetAudioSettings {
  latencyMode: ExperienceLatencyMode;
  preferredSampleRate: number | null;
  /** Default software monitor state when the preset is applied. */
  softwareMonitoring: boolean;
}

export interface ExperiencePreset {
  id: ExperiencePresetId;
  group: ExperiencePresetGroup;
  label: string;
  shortLabel: string;
  /** One-line job of this preset. */
  summary: string;
  /** Latency / feel knobs applied together. */
  audio: ExperiencePresetAudioSettings;
  /**
   * Strategy flags for future adapters (WebRTC, tips UI).
   * Keep additive — new flags must default safely.
   */
  strategy: {
    preferHardwareDirectMonitor: boolean;
    prioritizeDryRecordTap: boolean;
    prepareRemoteMediaPath: boolean;
  };
  /** What the user must do on the interface knob (app cannot control Direct Monitor). */
  hardwareDirectMonitor: HardwareDirectMonitorHint;
  /** A/B feel tests force IA off so scores stay comparable. */
  forceAiOff: boolean;
  tips: string[];
}

export interface AiAssistOption {
  id: AiAssistMode;
  label: string;
  summary: string;
  /** Runtime until the corresponding adapter exists. */
  status: "ready" | "inactive-stub";
}

export const EXPERIENCE_PRESETS: readonly ExperiencePreset[] = [
  {
    id: "feel",
    group: "play",
    label: "Feel (Direct)",
    shortLabel: "Feel",
    summary: "Best local playing feel — mute software monitor; use interface Direct Monitor.",
    audio: {
      latencyMode: "live",
      preferredSampleRate: 48000,
      softwareMonitoring: false,
    },
    strategy: {
      preferHardwareDirectMonitor: true,
      prioritizeDryRecordTap: false,
      prepareRemoteMediaPath: false,
    },
    hardwareDirectMonitor: "on",
    forceAiOff: false,
    tips: [
      "Enable Direct Monitor on the interface (Behringer MIX / Focusrite Direct).",
      "Set Primary output to the same interface as input.",
      "Software monitor stays off to avoid doubling the path.",
    ],
  },
  {
    id: "monitor-sw",
    group: "play",
    label: "Monitor SW",
    shortLabel: "Monitor",
    summary: "Hear through the browser when you need software monitor or FX in headphones.",
    audio: {
      latencyMode: "live",
      preferredSampleRate: 48000,
      softwareMonitoring: true,
    },
    strategy: {
      preferHardwareDirectMonitor: false,
      prioritizeDryRecordTap: false,
      prepareRemoteMediaPath: false,
    },
    hardwareDirectMonitor: "off",
    forceAiOff: false,
    tips: [
      "Turn Direct Monitor OFF (or MIX fully to USB) so you only hear the browser.",
      "Use headphones — speakers + open mic will feedback.",
      "Primary output should still be the audio interface when possible.",
    ],
  },
  {
    id: "capture",
    group: "play",
    label: "Capture",
    shortLabel: "Capture",
    summary: "Stable record-oriented path with dry tap priority; Direct Monitor for play-along.",
    audio: {
      latencyMode: "record",
      preferredSampleRate: 48000,
      softwareMonitoring: false,
    },
    strategy: {
      preferHardwareDirectMonitor: true,
      prioritizeDryRecordTap: true,
      prepareRemoteMediaPath: false,
    },
    hardwareDirectMonitor: "on",
    forceAiOff: false,
    tips: [
      "Prefer Direct Monitor while recording so feel stays hardware-side.",
      "Dry record tap stays before monitor FX (when recording lands).",
      "Switch back to Feel for pure playing tests.",
    ],
  },
  {
    id: "ab-direct",
    group: "ab",
    label: "① A/B Direct",
    shortLabel: "① Direct",
    summary: "Score feel 1–5: Direct Monitor ON + software monitor OFF (hardware path).",
    audio: {
      latencyMode: "live",
      preferredSampleRate: 48000,
      softwareMonitoring: false,
    },
    strategy: {
      preferHardwareDirectMonitor: true,
      prioritizeDryRecordTap: false,
      prepareRemoteMediaPath: false,
    },
    hardwareDirectMonitor: "on",
    forceAiOff: true,
    tips: [
      "1) Primary output = Behringer/Focusrite (not Realtek).",
      "2) On the interface: Direct Monitor / MIX toward INPUT (hardware).",
      "3) Software monitor is forced OFF by this preset.",
      "4) Play a short phrase → tap Feel 1–5 in the HUD → Copy benchmark JSON.",
    ],
  },
  {
    id: "ab-software",
    group: "ab",
    label: "② A/B Soft",
    shortLabel: "② Soft",
    summary: "Score feel 1–5: Direct Monitor OFF + software monitor ON (browser path ~64 ms).",
    audio: {
      latencyMode: "live",
      preferredSampleRate: 48000,
      softwareMonitoring: true,
    },
    strategy: {
      preferHardwareDirectMonitor: false,
      prioritizeDryRecordTap: false,
      prepareRemoteMediaPath: false,
    },
    hardwareDirectMonitor: "off",
    forceAiOff: true,
    tips: [
      "1) Primary output = Behringer/Focusrite.",
      "2) On the interface: Direct Monitor OFF (MIX fully to USB / computer).",
      "3) Software monitor is forced ON — you hear the ~64 ms browser path.",
      "4) Headphones recommended. Play → Feel 1–5 → Copy benchmark JSON.",
    ],
  },
] as const;

export const AI_ASSIST_OPTIONS: readonly AiAssistOption[] = [
  {
    id: "off",
    label: "IA off",
    summary: "No neural/PLC assist — baseline for A/B playing tests.",
    status: "ready",
  },
  {
    id: "remote-plc",
    label: "Remote PLC",
    summary: "Packet-loss concealment for remote peers (stub until WebRTC media path).",
    status: "inactive-stub",
  },
  {
    id: "experimental",
    label: "Experimental",
    summary: "Future neural assist (e.g. NAM/amp or predictive experiments) — opt-in only.",
    status: "inactive-stub",
  },
] as const;

export const DEFAULT_EXPERIENCE_PRESET_ID: ExperiencePresetId = "feel";
export const DEFAULT_AI_ASSIST_MODE: AiAssistMode = "off";

export function listPresetsByGroup(group: ExperiencePresetGroup): readonly ExperiencePreset[] {
  return EXPERIENCE_PRESETS.filter((preset) => preset.group === group);
}

export function getExperiencePreset(id: ExperiencePresetId): ExperiencePreset {
  const found = EXPERIENCE_PRESETS.find((preset) => preset.id === id);
  if (!found) {
    throw new Error(`Unknown experience preset: ${id}`);
  }
  return found;
}

export function getAiAssistOption(id: AiAssistMode): AiAssistOption {
  const found = AI_ASSIST_OPTIONS.find((option) => option.id === id);
  if (!found) {
    throw new Error(`Unknown AI assist mode: ${id}`);
  }
  return found;
}

export function isExperiencePresetId(value: string): value is ExperiencePresetId {
  return EXPERIENCE_PRESETS.some((preset) => preset.id === value);
}

export function isAiAssistMode(value: string): value is AiAssistMode {
  return AI_ASSIST_OPTIONS.some((option) => option.id === value);
}

export function isSubjectiveFeelScore(value: number): value is SubjectiveFeelScore {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function hardwareDirectMonitorLabel(hint: HardwareDirectMonitorHint): string {
  switch (hint) {
    case "on":
      return "HW Direct Monitor: ON (you set on interface)";
    case "off":
      return "HW Direct Monitor: OFF (MIX → USB)";
    case "optional":
      return "HW Direct Monitor: optional";
  }
}

/** Notices shown after applying a preset (tips + AI status reminder). */
export function buildExperienceNotices(
  preset: ExperiencePreset,
  aiMode: AiAssistMode,
): string[] {
  const ai = getAiAssistOption(aiMode);
  const aiLine =
    ai.id === "off"
      ? "IA assist: off (recommended baseline)."
      : `IA assist: ${ai.label} — ${ai.status === "inactive-stub" ? "stored preference only; DSP not active yet." : ai.summary}`;

  return [
    `Experience: ${preset.label} — ${preset.summary}`,
    hardwareDirectMonitorLabel(preset.hardwareDirectMonitor),
    `Software monitor: ${preset.audio.softwareMonitoring ? "ON" : "OFF"}`,
    ...preset.tips,
    aiLine,
  ];
}
