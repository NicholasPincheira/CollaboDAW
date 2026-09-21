import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type {
  ControlPlaneListener,
  ControlPlaneMetrics,
  ControlPlaneProbe,
} from "../../domain/session/control-plane-probe.ts";
import { emptyControlPlaneMetrics } from "../../domain/session/control-plane-probe.ts";

interface PingPayload {
  id: string;
  sentAt: number;
}

/**
 * Measures control-plane RTT via Supabase Realtime broadcast (self echo).
 * This is NOT media latency and stays tiny for free-tier usage.
 */
export class SupabaseControlPlaneProbe implements ControlPlaneProbe {
  private readonly client: SupabaseClient;
  private channel: RealtimeChannel | null = null;
  private metrics = emptyControlPlaneMetrics();
  private readonly listeners = new Set<ControlPlaneListener>();
  private readonly waiters = new Map<string, (rtt: number | null) => void>();

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  getMetrics(): ControlPlaneMetrics {
    return this.metrics;
  }

  subscribe(listener: ControlPlaneListener): () => void {
    this.listeners.add(listener);
    listener(this.metrics);
    return () => this.listeners.delete(listener);
  }

  async start(sessionId: string): Promise<void> {
    await this.stop();
    const channel = this.client.channel(`control-probe:${sessionId}`, {
      config: { broadcast: { self: true, ack: false } },
    });
    channel.on("broadcast", { event: "probe-ping" }, ({ payload }) => {
      const data = payload as PingPayload;
      const waiter = this.waiters.get(data.id);
      if (!waiter) return;
      this.waiters.delete(data.id);
      waiter(performance.now() - data.sentAt);
    });
    this.channel = channel;
    await new Promise<void>((resolve, reject) => {
      channel.subscribe((status, err) => {
        if (status === "SUBSCRIBED") resolve();
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          reject(err ?? new Error(`Control probe failed: ${status}`));
        }
      });
    });
  }

  async measure(samples = 8): Promise<ControlPlaneMetrics> {
    if (!this.channel) {
      this.metrics = {
        ...emptyControlPlaneMetrics(),
        lastError: "Probe channel not started.",
        updatedAt: new Date().toISOString(),
      };
      this.emit();
      return this.metrics;
    }

    const rtts: number[] = [];
    let lost = 0;
    for (let i = 0; i < samples; i += 1) {
      const id = crypto.randomUUID();
      const sentAt = performance.now();
      const rtt = await new Promise<number | null>((resolve) => {
        const timer = setTimeout(() => {
          this.waiters.delete(id);
          resolve(null);
        }, 1200);
        this.waiters.set(id, (value) => {
          clearTimeout(timer);
          resolve(value);
        });
        void this.channel?.send({
          type: "broadcast",
          event: "probe-ping",
          payload: { id, sentAt } satisfies PingPayload,
        });
      });
      if (rtt === null) lost += 1;
      else rtts.push(rtt);
      await sleep(40);
    }

    if (rtts.length === 0) {
      this.metrics = {
        ...emptyControlPlaneMetrics(),
        packetLossPct: 100,
        samples: 0,
        lastError: "All control pings timed out.",
        updatedAt: new Date().toISOString(),
      };
      this.emit();
      return this.metrics;
    }

    const mean = rtts.reduce((a, b) => a + b, 0) / rtts.length;
    const variance = rtts.reduce((sum, value) => sum + (value - mean) ** 2, 0) / rtts.length;
    const total = rtts.length + lost;
    this.metrics = {
      rttMs: mean,
      jitterMs: Math.sqrt(variance),
      packetLossPct: total > 0 ? (lost / total) * 100 : 0,
      samples: rtts.length,
      lastError: null,
      updatedAt: new Date().toISOString(),
    };
    this.emit();
    return this.metrics;
  }

  async stop(): Promise<void> {
    for (const waiter of this.waiters.values()) waiter(null);
    this.waiters.clear();
    const channel = this.channel;
    this.channel = null;
    if (channel) await this.client.removeChannel(channel);
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.metrics);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
