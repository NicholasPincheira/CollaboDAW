export interface ClockSyncSnapshot {
  offsetSeconds: number | null;
  driftSeconds: number | null;
}

export interface ClockSynchronizer {
  read(): ClockSyncSnapshot;
}
