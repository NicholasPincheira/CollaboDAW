import { describe, expect, it } from "vitest";
import { LocalChannelMappingOverrideStore } from "./local-mapping-overrides.ts";
import type { ChannelMapEntry } from "../../domain/audio/channel-mapper.ts";

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

describe("LocalChannelMappingOverrideStore", () => {
  it("persists overrides separately from vendor defaults", () => {
    const store = new LocalChannelMappingOverrideStore(new MemoryStorage());
    const entries: ChannelMapEntry[] = [
      { streamChannel: 1, label: "Microphone", type: "microphone", source: "learned" },
    ];
    store.set("focusrite itrack solo", entries);
    expect(store.get("focusrite itrack solo")).toEqual(entries);
    store.clear("focusrite itrack solo");
    expect(store.get("focusrite itrack solo")).toBeNull();
  });
});
