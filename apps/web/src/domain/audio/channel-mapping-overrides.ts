import type { ChannelMapEntry } from "./channel-mapper.ts";

export interface ChannelMappingOverrideStore {
  get(deviceKey: string): ChannelMapEntry[] | null;
  set(deviceKey: string, entries: readonly ChannelMapEntry[]): void;
  clear(deviceKey: string): void;
}

export function applyChannelMapOverrides(
  base: readonly ChannelMapEntry[],
  overrides: readonly ChannelMapEntry[] | null,
): ChannelMapEntry[] {
  if (!overrides || overrides.length === 0) {
    return base.map((entry) => ({ ...entry }));
  }

  const byLabel = new Map(overrides.map((entry) => [entry.label, entry]));
  return base.map((entry) => {
    const override = byLabel.get(entry.label);
    if (!override) return { ...entry };
    return {
      ...entry,
      streamChannel: override.streamChannel,
      type: override.type,
      source: override.source,
      label: override.label,
    };
  });
}
