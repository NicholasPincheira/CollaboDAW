import { describe, expect, it } from "vitest";
import { LocalSessionPresence } from "./local-session-presence.ts";

describe("LocalSessionPresence", () => {
  it("tracks self join and leave", async () => {
    const presence = new LocalSessionPresence();
    const snapshots: number[] = [];
    const stop = presence.subscribe((people) => snapshots.push(people.length));

    await presence.connect("room-1", { id: "a", name: "Alex" });
    expect(snapshots.at(-1)).toBe(1);

    await presence.updateSelf("Alexandra");
    await presence.disconnect();
    expect(snapshots.at(-1)).toBe(0);
    stop();
  });
});
