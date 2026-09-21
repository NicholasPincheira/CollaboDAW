export interface SessionClock {
  /**
   * Maps shared session time onto the local audio clock.
   * Returns null until an AudioContext owns local scheduling.
   */
  mapSessionTimeToLocalAudioTime(sessionTimeSeconds: number): number | null;
}
