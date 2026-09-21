import { describe, expect, it } from "vitest";
import {
  DEFAULT_STUDIO_ACCESS_KEY,
  isStudioUnlocked,
  lockStudio,
  unlockStudio,
} from "./studio-access.ts";

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

describe("studio access", () => {
  it("unlocks with the configured studio key", () => {
    const storage = new MemoryStorage();
    expect(unlockStudio("nope", {}, storage)).toBe(false);
    expect(isStudioUnlocked(storage)).toBe(false);
    expect(unlockStudio(DEFAULT_STUDIO_ACCESS_KEY, {}, storage)).toBe(true);
    expect(isStudioUnlocked(storage)).toBe(true);
    lockStudio(storage);
    expect(isStudioUnlocked(storage)).toBe(false);
  });
});
