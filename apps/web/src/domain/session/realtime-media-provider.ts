export interface RealtimeMediaProvider {
  readonly status: "unavailable";
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
