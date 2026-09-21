import type { SessionTransport } from "../../domain/session/session-transport.ts";
import { UnimplementedCapabilityError } from "../../domain/errors.ts";

export class UnavailableSessionTransport implements SessionTransport {
  readonly status = "unavailable" as const;

  connect(): Promise<void> {
    return Promise.reject(
      new UnimplementedCapabilityError(
        "SessionTransport",
        "Session control is deferred. No WebSocket or Supabase transport is wired.",
      ),
    );
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }
}
