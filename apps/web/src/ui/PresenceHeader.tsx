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
      <div className="flex items-center gap-1.5" aria-label="Connected users">
        {participants.length === 0 ? (
          <span className="text-xs text-studio-dim">
            {status === "connecting" ? "Connecting…" : "No one online"}
          </span>
        ) : (
          participants.map((person) => (
            <span
              key={person.id}
              title={person.name}
              className="inline-flex items-center gap-1.5 rounded-full border border-studio-line bg-studio-bg/70 py-0.5 pr-2 pl-0.5 text-xs text-studio-mist"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-studio-elevated"
                style={{ backgroundColor: person.color }}
                aria-hidden
              />
              <span className="max-w-24 truncate">{person.name}</span>
            </span>
          ))
        )}
      </div>
      <label className="flex items-center gap-2 text-xs text-studio-dim">
        You
        <input
          className="w-28 rounded-lg border border-studio-line bg-studio-bg px-2 py-1 text-xs text-studio-fog outline-none focus:border-studio-accent"
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
        <span className="text-[11px] text-studio-accent">{participants.length} online</span>
      ) : null}
    </div>
  );
}
