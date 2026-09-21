import type { ProjectDocument } from "./project-document.ts";

export function createEmptyProject(input: {
  id: string;
  name: string;
  bpm?: number;
  sampleRate?: number;
}): ProjectDocument {
  const bpm = input.bpm ?? 120;
  return {
    version: 1,
    id: input.id,
    name: input.name,
    sampleRate: input.sampleRate ?? 48000,
    timeSignature: { numerator: 4, denominator: 4 },
    tempoMap: [{ startBeat: 0, bpm }],
    tracks: [],
    markers: [],
    assets: [],
  };
}

export function projectBpm(project: ProjectDocument): number {
  return project.tempoMap[0]?.bpm ?? 120;
}
