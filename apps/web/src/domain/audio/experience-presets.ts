/**
 * High-level jam/experience presets that combine latency-improving options.
 * Orthogonal to low-level AudioContext latencyHint modes — presets apply a coherent bundle.
 *
 * AI assist is intentionally separate so players can A/B with/without it.
 */
export type ExperiencePresetId = "feel" | "monitor-sw" | "capture";

/** Mirrors AudioContext latencyHint presets used by the lab engine. */
export type ExperienceLatencyMode = "live" | "record" | "rehearsal" | "mix";

/** Extensible AI assist modes. Inactive stubs until media/DSP slices land. */
export type AiAssistMode = "off" | "remote-plc" | "experimental";

export interface ExperiencePresetAudioSettings {
  latencyMode: ExperienceLatencyMode;
  preferredSampleRate: number | null;
  /** Default software monitor state when the preset is applied. */
  softwareMonitoring: boolean;
}

export interface ExperiencePreset {
  id: ExperiencePresetId;
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
    tips: [
      "Enable Direct Monitor on the interface (Behringer MIX / Focusrite Direct).",
      "Set Primary output to the same interface as input.",
      "Software monitor stays off to avoid doubling the path.",
    ],
  },
  {
    id: "monitor-sw",
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
    tips: [
      "Use headphones — speakers + open mic will feedback.",
      "Primary output should still be the audio interface when possible.",
      "Path ms is browser base+output only, not full guitar→ear.",
    ],
  },
  {
    id: "capture",
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
    tips: [
      "Prefer Direct Monitor while recording so feel stays hardware-side.",
      "Dry record tap stays before monitor FX (when recording lands).",
      "Switch back to Feel for pure playing tests.",
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
    ...preset.tips,
    aiLine,
  ];
}
