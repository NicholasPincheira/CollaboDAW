import { useEffect, useState } from "react";
import type { SessionCatalog, WorkSessionSummary } from "../domain/session/session-catalog.ts";
import type { SessionBackend } from "../infrastructure/session/create-session-catalog.ts";

export function DashboardPage({
  catalog,
  backend,
  onOpen,
}: {
  catalog: SessionCatalog;
  backend: SessionBackend;
  onOpen: (sessionId: string) => void;
}) {
  const [recent, setRecent] = useState<WorkSessionSummary[] | null>(null);
  const [name, setName] = useState("Friday Jam");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [catalog]);

  async function refresh(): Promise<void> {
    const items = await catalog.listRecent(12);
    setRecent(items);
  }

  async function handleCreate(): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const session = await catalog.create({ name });
      await refresh();
      onOpen(session.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create session.");
    } finally {
      setBusy(false);
    }
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

  return (
    <div className="min-h-screen px-4 py-8 text-studio-fog md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.28em] text-studio-amber uppercase">MiniDAW</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">Collaborative</h1>
            <p className="mt-3 max-w-xl text-sm text-studio-mist md:text-base">
              Open a work session, wire your interface in the Audio Lab, then grow into local tracks and
              collaboration.
            </p>
          </div>
          <p className="rounded-full border border-studio-line bg-studio-elevated px-3 py-1 text-xs text-studio-dim">
            Persistence: {backend === "supabase" ? "Supabase" : "Local browser"}
          </p>
        </header>

        <section className="mb-10 rounded-2xl border border-studio-line bg-studio-panel/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <h2 className="text-sm tracking-[0.16em] text-studio-accent uppercase">New session</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              className="min-w-0 flex-1 rounded-xl border border-studio-line bg-studio-bg px-4 py-3 text-sm outline-none focus:border-studio-amber"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Session name"
              aria-label="Session name"
            />
            <button
              type="button"
              disabled={busy || name.trim().length === 0}
              onClick={() => void handleCreate()}
              className="rounded-xl bg-studio-fog px-5 py-3 text-sm font-semibold text-studio-bg disabled:opacity-40"
            >
              Create & open
            </button>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-studio-amber" role="alert">
              {error}
            </p>
          ) : null}
          {backend === "local" ? (
            <p className="mt-3 text-xs text-studio-dim">
              Supabase is not configured yet. Sessions are saved in this browser. Add
              `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then run the SQL migration.
            </p>
          ) : null}
        </section>

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
            <p className="rounded-2xl border border-dashed border-studio-line px-5 py-10 text-sm text-studio-dim">
              No sessions yet. Create one to enter the studio.
            </p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {recent.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-studio-line bg-studio-elevated p-4 transition hover:border-studio-amber/60"
                >
                  <button type="button" className="w-full text-left" onClick={() => onOpen(item.id)}>
                    <p className="truncate text-lg font-medium">{item.name}</p>
                    <p className="mt-1 text-xs text-studio-dim">
                      {item.bpm} BPM · updated {formatRelative(item.updatedAt)}
                    </p>
                  </button>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-studio-fog px-3 py-1.5 text-xs font-semibold text-studio-bg"
                      onClick={() => onOpen(item.id)}
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
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}
