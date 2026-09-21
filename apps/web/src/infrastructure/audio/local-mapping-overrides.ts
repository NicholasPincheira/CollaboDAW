import type { ChannelMapEntry } from "../../domain/audio/channel-mapper.ts";
import type { ChannelMappingOverrideStore } from "../../domain/audio/channel-mapping-overrides.ts";
import type { AudioInputType } from "../../domain/audio/hardware-profile.ts";

const STORAGE_PREFIX = "minidaw.channel-map.";

export class LocalChannelMappingOverrideStore implements ChannelMappingOverrideStore {
  private readonly storage: Storage | null;

  constructor(storage: Storage | null = defaultStorage()) {
    this.storage = storage;
  }
  get(deviceKey: string): ChannelMapEntry[] | null {
    if (!this.storage) return null;
    const raw = this.storage.getItem(STORAGE_PREFIX + deviceKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return null;
      return parsed.map(normalizeEntry).filter((entry): entry is ChannelMapEntry => entry !== null);
    } catch {
      return null;
    }
  }

  set(deviceKey: string, entries: readonly ChannelMapEntry[]): void {
    if (!this.storage) return;
    this.storage.setItem(STORAGE_PREFIX + deviceKey, JSON.stringify(entries));
  }

  clear(deviceKey: string): void {
    this.storage?.removeItem(STORAGE_PREFIX + deviceKey);
  }
}

function defaultStorage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function normalizeEntry(value: unknown): ChannelMapEntry | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.label !== "string") return null;
  const streamChannel =
    record.streamChannel === null
      ? null
      : typeof record.streamChannel === "number"
        ? record.streamChannel
        : null;
  const type = isInputType(record.type) ? record.type : "unknown";
  const source =
    record.source === "manual" ||
    record.source === "learned" ||
    record.source === "generic" ||
    record.source === "profile-default"
      ? record.source
      : "manual";
  return { label: record.label, streamChannel, type, source };
}

function isInputType(value: unknown): value is AudioInputType {
  return (
    value === "microphone" ||
    value === "instrument" ||
    value === "line" ||
    value === "stereo" ||
    value === "unknown"
  );
}
