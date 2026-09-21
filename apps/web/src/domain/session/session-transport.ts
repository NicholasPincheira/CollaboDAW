export interface SessionTransport {
  readonly status: "unavailable";
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}
