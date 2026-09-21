import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type {
  PresenceListener,
  PresenceParticipant,
  SessionPresence,
} from "../../domain/session/session-presence.ts";
import { colorForParticipant } from "../../domain/session/session-presence.ts";

interface PresencePayload {
  name?: string;
  color?: string;
  onlineAt?: number;
}

export class SupabaseSessionPresence implements SessionPresence {
  private readonly client: SupabaseClient;
  private channel: RealtimeChannel | null = null;
  private selfId = "";
  private selfName = "Guest";
  private readonly listeners = new Set<PresenceListener>();

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async connect(sessionId: string, self: { id: string; name: string }): Promise<void> {
    await this.disconnect();
    this.selfId = self.id;
    this.selfName = self.name.trim() || "Guest";

    const channel = this.client.channel(`session-presence:${sessionId}`, {
      config: { presence: { key: self.id } },
    });

    channel.on("presence", { event: "sync" }, () => {
      this.emitFromChannel(channel);
    });
    channel.on("presence", { event: "join" }, () => {
      this.emitFromChannel(channel);
    });
    channel.on("presence", { event: "leave" }, () => {
      this.emitFromChannel(channel);
    });

    this.channel = channel;

    await new Promise<void>((resolve, reject) => {
      channel.subscribe(async (status, err) => {
        if (status === "SUBSCRIBED") {
          try {
            await channel.track({
              name: this.selfName,
              color: colorForParticipant(this.selfId),
              onlineAt: Date.now(),
            } satisfies PresencePayload);
            this.emitFromChannel(channel);
            resolve();
          } catch (error) {
            reject(error);
          }
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          reject(err ?? new Error(`Presence channel failed: ${status}`));
        }
      });
    });
  }

  async updateSelf(name: string): Promise<void> {
    this.selfName = name.trim() || "Guest";
    if (!this.channel) return;
    await this.channel.track({
      name: this.selfName,
      color: colorForParticipant(this.selfId),
      onlineAt: Date.now(),
    } satisfies PresencePayload);
  }

  subscribe(listener: PresenceListener): () => void {
    this.listeners.add(listener);
    if (this.channel) this.emitFromChannel(this.channel);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async disconnect(): Promise<void> {
    const channel = this.channel;
    this.channel = null;
    if (!channel) {
      this.emit([]);
      return;
    }
    try {
      await channel.untrack();
    } catch {
      // ignore untrack errors during teardown
    }
    await this.client.removeChannel(channel);
    this.emit([]);
  }

  private emitFromChannel(channel: RealtimeChannel): void {
    const state = channel.presenceState<PresencePayload>();
    const participants: PresenceParticipant[] = [];
    for (const [id, metas] of Object.entries(state)) {
      const meta = metas[0];
      if (!meta) continue;
      participants.push({
        id,
        name: typeof meta.name === "string" && meta.name.trim() ? meta.name.trim() : "Guest",
        color: typeof meta.color === "string" ? meta.color : colorForParticipant(id),
        onlineAt: typeof meta.onlineAt === "number" ? meta.onlineAt : Date.now(),
      });
    }
    participants.sort((a, b) => a.onlineAt - b.onlineAt || a.name.localeCompare(b.name));
    this.emit(participants);
  }

  private emit(participants: PresenceParticipant[]): void {
    for (const listener of this.listeners) listener(participants);
  }
}
