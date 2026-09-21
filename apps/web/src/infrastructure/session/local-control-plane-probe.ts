import type {
  ControlPlaneListener,
  ControlPlaneMetrics,
  ControlPlaneProbe,
} from "../../domain/session/control-plane-probe.ts";
import { emptyControlPlaneMetrics } from "../../domain/session/control-plane-probe.ts";

/** Offline/local fallback: no network path to measure. */
export class LocalControlPlaneProbe implements ControlPlaneProbe {
  private metrics = emptyControlPlaneMetrics();
  private readonly listeners = new Set<ControlPlaneListener>();

  getMetrics(): ControlPlaneMetrics {
    return this.metrics;
  }

  subscribe(listener: ControlPlaneListener): () => void {
    this.listeners.add(listener);
    listener(this.metrics);
    return () => this.listeners.delete(listener);
  }

  async start(_sessionId: string): Promise<void> {
    this.metrics = {
      ...emptyControlPlaneMetrics(),
      lastError: "Control-plane probe needs Supabase Realtime.",
      updatedAt: new Date().toISOString(),
    };
    this.emit();
  }

  async measure(_samples?: number): Promise<ControlPlaneMetrics> {
    this.metrics = {
      ...emptyControlPlaneMetrics(),
      lastError: "Network RTT requires Supabase backend.",
      updatedAt: new Date().toISOString(),
    };
    this.emit();
    return this.metrics;
  }

  async stop(): Promise<void> {
    // no-op
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.metrics);
  }
}
