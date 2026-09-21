export interface TempoMapEntry {
  startBeat: number;
  bpm: number;
}

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

/**
 * Portable project document. Tracks stay empty until the local MiniDAW slice.
 * Raw PCM does not belong in this document.
 */
export interface ProjectDocument {
  version: 1;
  id: string;
  name: string;
  sampleRate: number;
  timeSignature: TimeSignature;
  tempoMap: TempoMapEntry[];
  tracks: [];
  markers: [];
  assets: [];
}
