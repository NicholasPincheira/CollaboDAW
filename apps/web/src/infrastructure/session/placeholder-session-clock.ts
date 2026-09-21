import type { SessionClock } from "../../domain/session/session-clock.ts";

export class PlaceholderSessionClock implements SessionClock {
  mapSessionTimeToLocalAudioTime(_sessionTimeSeconds: number): number | null {
    return null;
  }
}
