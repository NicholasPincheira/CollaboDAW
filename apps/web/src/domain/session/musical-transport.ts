export type TransportState = "stopped" | "playing" | "paused";

export interface MusicalTransport {
  readonly state: TransportState;
  readonly bpm: number | null;
  play(): void;
  pause(): void;
  stop(): void;
}
