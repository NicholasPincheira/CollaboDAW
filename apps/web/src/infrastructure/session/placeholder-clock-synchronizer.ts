import type { ClockSyncSnapshot, ClockSynchronizer } from "../../domain/session/clock-synchronizer.ts";

export class PlaceholderClockSynchronizer implements ClockSynchronizer {
  read(): ClockSyncSnapshot {
    return { offsetSeconds: null, driftSeconds: null };
  }
}
