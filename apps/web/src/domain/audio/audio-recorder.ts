export interface AudioRecorder {
  readonly capability: "unavailable";
  start(): Promise<void>;
  stop(): Promise<Blob>;
}
