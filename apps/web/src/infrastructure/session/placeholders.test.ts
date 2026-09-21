import { describe, expect, it } from "vitest";
import { UnimplementedCapabilityError } from "../../domain/errors.ts";
import type { ProjectDocument } from "../../domain/project/project-document.ts";
import { MemoryAssetStorage } from "../project/memory-asset-storage.ts";
import { MemoryProjectRepository } from "../project/memory-project-repository.ts";
import { PlaceholderClockSynchronizer } from "./placeholder-clock-synchronizer.ts";
import { PlaceholderMusicalTransport } from "./placeholder-musical-transport.ts";
import { PlaceholderSessionClock } from "./placeholder-session-clock.ts";
import { UnavailableRealtimeMediaProvider } from "./unavailable-realtime-media-provider.ts";
import { UnavailableSessionTransport } from "./unavailable-session-transport.ts";

const project: ProjectDocument = {
  version: 1,
  id: "project-id",
  name: "Friday Jam",
  sampleRate: 48000,
  timeSignature: { numerator: 4, denominator: 4 },
  tempoMap: [{ startBeat: 0, bpm: 120 }],
  tracks: [],
  markers: [],
  assets: [],
};

describe("session and storage placeholders", () => {
  it("does not treat session time zero as a local audio time", () => {
    const clock = new PlaceholderSessionClock();
    expect(clock.mapSessionTimeToLocalAudioTime(0)).toBeNull();
    expect(new PlaceholderClockSynchronizer().read()).toEqual({
      offsetSeconds: null,
      driftSeconds: null,
    });
  });

  it("does not start a musical or realtime transport", async () => {
    const transport = new PlaceholderMusicalTransport();
    expect(transport.bpm).toBeNull();
    expect(() => transport.play()).toThrow(UnimplementedCapabilityError);
    const media = new UnavailableRealtimeMediaProvider();
    const session = new UnavailableSessionTransport();
    expect(media.status).toBe("unavailable");
    expect(session.status).toBe("unavailable");
    await expect(media.connect()).rejects.toBeInstanceOf(UnimplementedCapabilityError);
    await expect(session.connect()).rejects.toBeInstanceOf(UnimplementedCapabilityError);
  });

  it("round-trips a project and an asset in memory", async () => {
    const repository = new MemoryProjectRepository();
    const saved = structuredClone(project);
    await repository.save(saved);
    saved.name = "Changed";
    await expect(repository.load(project.id)).resolves.toMatchObject({ name: "Friday Jam" });
    await expect(repository.load("missing")).resolves.toBeNull();

    const storage = new MemoryAssetStorage();
    await storage.put("take-001", new Blob(["pcm"]));
    const asset = await storage.get("take-001");
    await expect(asset?.text()).resolves.toBe("pcm");
    await expect(storage.get("missing")).resolves.toBeNull();
  });
});
