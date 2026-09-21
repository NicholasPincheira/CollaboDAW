export interface PresenceParticipant {
  id: string;
  name: string;
  color: string;
  onlineAt: number;
}

export type PresenceListener = (participants: PresenceParticipant[]) => void;

export interface SessionPresence {
  connect(sessionId: string, self: { id: string; name: string }): Promise<void>;
  updateSelf(name: string): Promise<void>;
  subscribe(listener: PresenceListener): () => void;
  disconnect(): Promise<void>;
}

const COLORS = ["#ff7a18", "#3dd6c6", "#e5484d", "#8b5cf6", "#d97757", "#64b5f6"] as const;

export function colorForParticipant(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length] ?? COLORS[0];
}
