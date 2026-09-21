export type AudioEngineState = "idle" | "running" | "suspended" | "closed";

/** Measured audio facts. Null means the value was not measured. */
export interface AudioDiagnostics {
  sampleRate: number | null;
  baseLatencySeconds: number | null;
  outputLatencySeconds: number | null;
  inputChannelCount: number | null;
}

export interface AudioEngine {
  readonly state: AudioEngineState;
  start(): Promise<void>;
  stop(): Promise<void>;
  getDiagnostics(): AudioDiagnostics;
}
