import type { MusicalTransport, TransportState } from "../../domain/session/musical-transport.ts";
import { UnimplementedCapabilityError } from "../../domain/errors.ts";

export class PlaceholderMusicalTransport implements MusicalTransport {
  readonly state: TransportState = "stopped";
  readonly bpm: number | null = null;

  play(): void {
    throw new UnimplementedCapabilityError(
      "MusicalTransport",
      "Musical scheduling is not implemented in this slice.",
    );
  }

  pause(): void {
    throw new UnimplementedCapabilityError(
      "MusicalTransport",
      "Musical scheduling is not implemented in this slice.",
    );
  }

  stop(): void {
    throw new UnimplementedCapabilityError(
      "MusicalTransport",
      "Musical scheduling is not implemented in this slice.",
    );
  }
}
