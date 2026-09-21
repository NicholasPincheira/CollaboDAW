import type {
  PresenceListener,
  PresenceParticipant,
  SessionPresence,
} from "../../domain/session/session-presence.ts";
import { colorForParticipant } from "../../domain/session/session-presence.ts";

/** Single-client presence when Supabase Realtime is unavailable. */
export class LocalSessionPresence implements SessionPresence {
  private self: PresenceParticipant | null = null;
  private readonly listeners = new Set<PresenceListener>();

  async connect(_sessionId: string, self: { id: string; name: string }): Promise<void> {
    this.self = {
      id: self.id,
      name: self.name.trim() || "Guest",
      color: colorForParticipant(self.id),
      onlineAt: Date.now(),
    };
    this.emit();
  }

  async updateSelf(name: string): Promise<void> {
    if (!this.self) return;
    this.self = { ...this.self, name: name.trim() || "Guest", onlineAt: Date.now() };
    this.emit();
  }

  subscribe(listener: PresenceListener): () => void {
    this.listeners.add(listener);
    if (this.self) listener([this.self]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async disconnect(): Promise<void> {
    this.self = null;
    this.emit();
  }

  private emit(): void {
    const snapshot = this.self ? [this.self] : [];
    for (const listener of this.listeners) listener(snapshot);
  }
}
