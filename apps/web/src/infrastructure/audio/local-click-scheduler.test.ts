import { describe, expect, it, vi } from "vitest";
import { LocalClickScheduler } from "./local-click-scheduler.ts";

describe("LocalClickScheduler", () => {
  it("starts and stops without throwing when a context exists", () => {
    const context = {
      currentTime: 1,
      destination: {},
      createOscillator: () => ({
        type: "square",
        frequency: { value: 0 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createGain: () => ({
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      }),
    } as unknown as AudioContext;

    const scheduler = new LocalClickScheduler(() => context, () => context.destination);
    scheduler.start(120, 4);
    expect(scheduler.isPlaying()).toBe(true);
    scheduler.stop();
    expect(scheduler.isPlaying()).toBe(false);
  });
});
