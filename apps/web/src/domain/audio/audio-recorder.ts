export type AudioRecorderCapability = "unavailable" | "media-recorder";

export type AudioRecorderPhase = "idle" | "recording";

/**
 * Dry recording boundary. Implementations capture a MediaStream tap
 * taken before monitor FX (see WebAudioLabEngine dry dest).
 */
export interface AudioRecorder {
  readonly capability: AudioRecorderCapability;
  getPhase(): AudioRecorderPhase;
  start(stream: MediaStream): Promise<void>;
  stop(): Promise<Blob>;
}
