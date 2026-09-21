import { describe, expect, it } from "vitest";
import { LocalSessionCatalog } from "./local-session-catalog.ts";

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

describe("LocalSessionCatalog", () => {
  it("creates, lists, opens with code, saves, and deletes sessions", async () => {
    const catalog = new LocalSessionCatalog(new MemoryStorage());
    const created = await catalog.create({ name: "Friday Jam", accessCode: "friday-band", bpm: 96 });
    expect(created.project.tempoMap[0]?.bpm).toBe(96);

    const recent = await catalog.listRecent();
    expect(recent[0]?.id).toBe(created.id);

    expect(await catalog.openWithCode(created.id, "wrong-code")).toBeNull();
    const loaded = await catalog.openWithCode(created.id, "friday-band");
    expect(loaded?.name).toBe("Friday Jam");

    const saved = await catalog.save({
      ...created,
      project: { ...created.project, name: "Saturday Jam" },
    });
    expect(saved.name).toBe("Saturday Jam");
    expect((await catalog.get(created.id))?.name).toBe("Saturday Jam");

    await catalog.remove(created.id);
    expect(await catalog.get(created.id)).toBeNull();
  });
});
