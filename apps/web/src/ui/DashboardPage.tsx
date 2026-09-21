import { useEffect, useRef, useState } from "react";
import type { SessionCatalog, WorkSessionSummary } from "../domain/session/session-catalog.ts";
import type { SessionBackend } from "../infrastructure/session/create-session-catalog.ts";
import {
  isHostCreateEnabled,
  isRoomUnlocked,
  lockStudio,
  markRoomUnlocked,
  unlockStudio,
} from "../infrastructure/session/studio-access.ts";
import { playDashboardIntro } from "./shell-motion.ts";

export function DashboardPage({
  catalog,
  backend,
  hostMode,
  onHostModeChange,
  onOpen,
}: {
  catalog: SessionCatalog;
  backend: SessionBackend;
  hostMode: boolean;
  onHostModeChange: (open: boolean) => void;
  onOpen: (sessionId: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [recent, setRecent] = useState<WorkSessionSummary[] | null>(null);
  const [name, setName] = useState("Friday Jam");
  const [roomCode, setRoomCode] = useState("");
  const [joinId, setJoinId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [hostKey, setHostKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canCreate = hostMode && isHostCreateEnabled();

  useEffect(() => {
    if (!hostMode) {
      setRecent([]);
      return;
    }
    let cancelled = false;
    void catalog
      .listRecent(12)
      .then((items) => {
        if (!cancelled) setRecent(items);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load sessions.");
        setRecent([]);
      });
    return () => {
      cancelled = true;
    };
  }, [catalog, hostMode]);

  useEffect(() => {
    if (recent === null) return;
    let cancelled = false;
    let animation: { kill: () => void } | null = null;
    void playDashboardIntro(rootRef.current).then((tween) => {
      if (cancelled) {
        tween?.kill();
        return;
      }
      animation = tween;
    });
    return () => {
      cancelled = true;
      animation?.kill();
    };
  }, [recent]);

  async function refresh(): Promise<void> {
    const items = await catalog.listRecent(12);
    setRecent(items);
  }

  async function handleCreate(): Promise<void> {
    if (!canCreate) return;
    setBusy(true);
    setError(null);
    try {
      const session = await catalog.create({ name, accessCode: roomCode });
      markRoomUnlocked(session.id);
      await refresh();
      onOpen(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create session.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const session = await catalog.openWithCode(joinId.trim(), joinCode);
      if (!session) {
        setError("Wrong room id or password.");
        return;
      }
      markRoomUnlocked(session.id);
      onOpen(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open session.");
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenListed(id: string): Promise<void> {
    if (isRoomUnlocked(id)) {
      onOpen(id);
      return;
    }
    setJoinId(id);
    setError("Enter the room password below to unlock this session.");
  }

  async function handleRemove(id: string): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      await catalog.remove(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete session.");
    } finally {
      setBusy(false);
    }
  }

  function handleHostUnlock(): void {
    if (unlockStudio(hostKey)) {
      onHostModeChange(true);
      setError(null);
      setHostKey("");
      return;
    }
    setError("Wrong host key, or VITE_STUDIO_ACCESS_KEY is not configured in this build.");
  }

  return (
    <div ref={rootRef} className="min-h-screen px-4 py-8 text-studio-fog md:px-8">
      <div className="mx-auto max-w-6xl">
        <header data-motion="header" className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.28em] text-studio-amber uppercase">MiniDAW</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Collaborative</h1>
            <p className="mt-3 max-w-xl text-sm text-studio-mist md:text-base">
              Join with a room id + password. Creating rooms requires the private host key.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="rounded-full border border-studio-line bg-studio-elevated px-3 py-1 text-xs text-studio-dim">
              Persistence: {backend === "supabase" ? "Supabase" : "Local browser"}
            </p>
            {hostMode ? (
              <button
                type="button"
                className="rounded-full border border-studio-line px-3 py-1 text-xs text-studio-mist"
                onClick={() => {
                  lockStudio();
                  onHostModeChange(false);
                }}
              >
                Exit host mode
              </button>
            ) : null}
          </div>
        </header>

        <section
          data-motion="create"
          className="mb-8 rounded-2xl border border-studio-line bg-studio-panel/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
        >
          <h2 className="text-sm tracking-[0.16em] text-studio-accent uppercase">Join room</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr_auto]">
            <input
              className="min-w-0 rounded-xl border border-studio-line bg-studio-bg px-4 py-3 text-sm outline-none focus:border-studio-amber"
              value={joinId}
              onChange={(event) => setJoinId(event.target.value)}
              placeholder="Session id (UUID)"
              aria-label="Session id"
            />
            <input
              type="password"
              className="min-w-0 rounded-xl border border-studio-line bg-studio-bg px-4 py-3 text-sm outline-none focus:border-studio-amber"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              placeholder="Room password"
              aria-label="Room password"
              autoComplete="current-password"
            />
            <button
              type="button"
              disabled={busy || joinId.trim().length < 8 || joinCode.trim().length < 4}
              onClick={() => void handleJoin()}
              className="rounded-xl bg-studio-fog px-5 py-3 text-sm font-semibold text-studio-bg disabled:opacity-40"
            >
              Join
            </button>
          </div>
        </section>

        {!hostMode ? (
          <section className="mb-10 rounded-2xl border border-dashed border-studio-line p-5">
            <h2 className="text-sm tracking-[0.16em] text-studio-mist uppercase">Host unlock</h2>
            <p className="mt-2 text-xs text-studio-dim">
              Required to create rooms and list recent sessions. Key lives in Pages/`VITE_STUDIO_ACCESS_KEY`
              (see `docs/ACCESS.md`).
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="password"
                className="min-w-0 flex-1 rounded-xl border border-studio-line bg-studio-bg px-4 py-3 text-sm outline-none focus:border-studio-amber"
                value={hostKey}
                onChange={(event) => setHostKey(event.target.value)}
                placeholder="Host key"
                aria-label="Host key"
              />
              <button
                type="button"
                className="rounded-xl border border-studio-line px-5 py-3 text-sm text-studio-mist"
                onClick={handleHostUnlock}
              >
                Unlock host tools
              </button>
            </div>
          </section>
        ) : (
          <section className="mb-10 rounded-2xl border border-studio-line bg-studio-panel/90 p-5">
            <h2 className="text-sm tracking-[0.16em] text-studio-accent uppercase">New session (host)</h2>
            {!isHostCreateEnabled() ? (
              <p className="mt-3 text-sm text-studio-amber">
                This build has no `VITE_STUDIO_ACCESS_KEY`. Set it in Cloudflare Pages and rebuild.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input
                  className="min-w-0 rounded-xl border border-studio-line bg-studio-bg px-4 py-3 text-sm outline-none focus:border-studio-amber"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Session name"
                  aria-label="Session name"
                />
                <input
                  type="password"
                  className="min-w-0 rounded-xl border border-studio-line bg-studio-bg px-4 py-3 text-sm outline-none focus:border-studio-amber"
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value)}
                  placeholder="Room password (min 4)"
                  aria-label="Room password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  disabled={busy || name.trim().length === 0 || roomCode.trim().length < 4}
                  onClick={() => void handleCreate()}
                  className="rounded-xl bg-studio-fog px-5 py-3 text-sm font-semibold text-studio-bg disabled:opacity-40"
                >
                  Create & open
                </button>
              </div>
            )}
          </section>
        )}

        {error ? (
          <p className="mb-6 text-sm text-studio-amber" role="alert">
            {error}
          </p>
        ) : null}

        {hostMode ? (
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm tracking-[0.16em] text-studio-mist uppercase">Recent sessions</h2>
              <button
                type="button"
                className="text-xs text-studio-dim underline-offset-2 hover:underline"
                onClick={() => void refresh()}
              >
                Refresh
              </button>
            </div>
            {recent === null ? (
              <p className="text-sm text-studio-dim">Loading sessions…</p>
            ) : recent.length === 0 ? (
              <p
                data-motion="recent"
                className="rounded-2xl border border-dashed border-studio-line px-5 py-10 text-sm text-studio-dim"
              >
                No sessions yet.
              </p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {recent.map((item) => (
                  <li
                    key={item.id}
                    data-motion="recent"
                    className="rounded-2xl border border-studio-line bg-studio-elevated p-4"
                  >
                    <p className="truncate text-lg font-medium">{item.name}</p>
                    <p className="mt-1 break-all text-[11px] text-studio-dim">{item.id}</p>
                    <p className="mt-1 text-xs text-studio-dim">
                      {item.bpm} BPM · {isRoomUnlocked(item.id) ? "unlocked" : "locked"}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg bg-studio-fog px-3 py-1.5 text-xs font-semibold text-studio-bg"
                        onClick={() => void handleOpenListed(item.id)}
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-studio-line px-3 py-1.5 text-xs text-studio-mist"
                        disabled={busy}
                        onClick={() => void handleRemove(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
