export interface ControlPlaneMetrics {
  rttMs: number | null;
  jitterMs: number | null;
  packetLossPct: number | null;
  samples: number;
  lastError: string | null;
  updatedAt: string | null;
}

export type ControlPlaneListener = (metrics: ControlPlaneMetrics) => void;

export interface ControlPlaneProbe {
  start(sessionId: string): Promise<void>;
  stop(): Promise<void>;
  /** Burst of lightweight pings; safe for Supabase free-tier control traffic. */
  measure(samples?: number): Promise<ControlPlaneMetrics>;
  getMetrics(): ControlPlaneMetrics;
  subscribe(listener: ControlPlaneListener): () => void;
}

export function emptyControlPlaneMetrics(): ControlPlaneMetrics {
  return {
    rttMs: null,
    jitterMs: null,
    packetLossPct: null,
    samples: 0,
    lastError: null,
    updatedAt: null,
  };
}
