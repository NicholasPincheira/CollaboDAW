export type AudioInputType = "microphone" | "instrument" | "line" | "stereo" | "unknown";

export type AudioInputPreference = "vocal" | "guitar" | "bass" | "line";

/**
 * Advisory channel index from a vendor profile.
 * Null means the profile states the role but not the browser stream order.
 */
export interface AudioInputProfile {
  channelIndex: number | null;
  label: string;
  type: AudioInputType;
  preferredFor?: AudioInputPreference;
}

export interface AudioOutputProfile {
  channelIndex: number | null;
  label: string;
}

/** Every token must appear in the normalized device label. */
export interface HardwareMatcher {
  includes: readonly string[];
}

export type ChannelOrderPolicy = "advisory" | "runtime";

export interface AudioHardwareProfile {
  id: string;
  manufacturer: string;
  model: string;
  matchers: readonly HardwareMatcher[];
  defaultInputs: readonly AudioInputProfile[];
  defaultOutputs: readonly AudioOutputProfile[];
  channelOrder: ChannelOrderPolicy;
  notes: readonly string[];
}

export interface AudioDeviceProfileRegistry {
  list(): readonly AudioHardwareProfile[];
  resolve(label: string): AudioHardwareProfile | null;
}
