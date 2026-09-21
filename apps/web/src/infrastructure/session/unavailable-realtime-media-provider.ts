import type { RealtimeMediaProvider } from "../../domain/session/realtime-media-provider.ts";
import { UnimplementedCapabilityError } from "../../domain/errors.ts";

export class UnavailableRealtimeMediaProvider implements RealtimeMediaProvider {
  readonly status = "unavailable" as const;

  connect(): Promise<void> {
    return Promise.reject(
      new UnimplementedCapabilityError(
        "RealtimeMediaProvider",
        "Realtime media is deferred. WebRTC and LiveKit are not wired.",
      ),
    );
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }
}
