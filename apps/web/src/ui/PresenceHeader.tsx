import { useEffect, useRef, useState } from "react";
import type { PresenceParticipant, SessionPresence } from "../domain/session/session-presence.ts";
import {
  createPresenceParticipantId,
  readDisplayName,
  writeDisplayName,
} from "../infrastructure/session/studio-access.ts";

export function PresenceHeader({
  sessionId,
  createPresence,
}: {
  sessionId: string;
  createPresence: () => SessionPresence;
}) {
  const presenceRef = useRef<SessionPresence | null>(null);
  const [participants, setParticipants] = useState<PresenceParticipant[]>([]);
  const [displayName, setDisplayName] = useState(() => readDisplayName());
  const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const presence = createPresence();
    presenceRef.current = presence;
    const participantId = createPresenceParticipantId();
    let cancelled = false;

    const unsubscribe = presence.subscribe((next) => {
      if (!cancelled) setParticipants(next);
    });

    void presence
      .connect(sessionId, { id: participantId, name: readDisplayName() })
      .then(() => {
        if (!cancelled) {
          setStatus("live");
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : "Presence unavailable.");
      });

    const onLeave = (): void => {
      void presence.disconnect();
    };
    window.addEventListener("pagehide", onLeave);

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", onLeave);
      unsubscribe();
      void presence.disconnect();
      presenceRef.current = null;
    };
  }, [createPresence, sessionId]);

  async function commitName(): Promise<void> {
    const next = writeDisplayName(displayName);
    setDisplayName(next);
    try {
      await presenceRef.current?.updateSelf(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update name.");
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
      <div className="flex items-center" aria-label="Connected users">
        {participants.length === 0 ? (
          <span className="text-xs text-studio-dim">
            {status === "connecting" ? "Connecting…" : "Solo en sala"}
          </span>
        ) : (
          <div className="flex -space-x-2">
            {participants.slice(0, 5).map((person) => (
              <span
                key={person.id}
                title={person.name}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-studio-panel text-[10px] font-medium text-studio-bg ring-1 ring-white/10"
                style={{ backgroundColor: person.color }}
              >
                {person.name.slice(0, 1).toUpperCase()}
              </span>
            ))}
            {participants.length > 5 ? (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-studio-panel bg-studio-elevated text-[9px] text-studio-dim">
                +{participants.length - 5}
              </span>
            ) : null}
          </div>
        )}
      </div>
      <label className="flex items-center gap-2 text-xs text-studio-dim">
        Tú
        <input
          className="w-24 rounded-lg border border-white/10 bg-studio-bg/60 px-2 py-1 text-xs text-studio-fog outline-none focus:border-studio-accent/50 md:w-28"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          onBlur={() => void commitName()}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          aria-label="Your display name"
        />
      </label>
      {error ? (
        <span className="text-[11px] text-studio-amber" role="status">
          {error}
        </span>
      ) : status === "live" ? (
        <span className="rounded-full bg-studio-accent/15 px-2 py-0.5 text-[11px] text-studio-accent">
          {participants.length} online
        </span>
      ) : null}
    </div>
  );
}
