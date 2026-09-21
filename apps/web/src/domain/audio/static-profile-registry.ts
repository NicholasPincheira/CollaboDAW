import type { AudioHardwareProfile, AudioDeviceProfileRegistry } from "./hardware-profile.ts";
import { KNOWN_AUDIO_PROFILES, normalizeDeviceLabel } from "./known-profiles.ts";

export class StaticAudioDeviceProfileRegistry implements AudioDeviceProfileRegistry {
  private readonly profiles: readonly AudioHardwareProfile[];

  constructor(profiles: readonly AudioHardwareProfile[] = KNOWN_AUDIO_PROFILES) {
    this.profiles = profiles;
  }

  list(): readonly AudioHardwareProfile[] {
    return this.profiles;
  }

  resolve(label: string): AudioHardwareProfile | null {
    const normalized = normalizeDeviceLabel(label);
    const words = new Set(normalized.split(" ").filter((token) => token.length > 0));
    const compact = normalized.replace(/ /g, "");
    return (
      this.profiles.find((profile) =>
        profile.matchers.some((matcher) =>
          matcher.includes.every(
            (token) => words.has(token) || (token.length > 3 && compact.includes(token)),
          ),
        ),
      ) ?? null
    );
  }
}
