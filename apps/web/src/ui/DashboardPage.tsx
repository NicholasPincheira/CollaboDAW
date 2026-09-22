import { useEffect, useRef, useState } from "react";
import { CircleHelp, Plus, Radio } from "lucide-react";
import type { SessionCatalog, WorkSessionSummary } from "../domain/session/session-catalog.ts";
import type { SessionBackend } from "../infrastructure/session/create-session-catalog.ts";
import {
  isHostCreateEnabled,
  isRoomUnlocked,
  lockStudio,
  markRoomUnlocked,
  unlockStudio,
} from "../infrastructure/session/studio-access.ts";
import { SessionRoomCard } from "./SessionRoomCard.tsx";
import { GlassCard } from "./primitives/GlassCard.tsx";
import { GradientText } from "./primitives/GradientText.tsx";
import { InfoBanner } from "./primitives/InfoBanner.tsx";
import { PillTabs } from "./primitives/PillTabs.tsx";
import { StudioButton } from "./primitives/StudioButton.tsx";
import { playDashboardIntro } from "./shell-motion.ts";

type LobbyTab = "join" | "host";

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
  const [tab, setTab] = useState<LobbyTab>("join");
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
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load sessions.");
          setRecent([]);
        }
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

  useEffect(() => {
    if (hostMode) setTab("host");
  }, [hostMode]);

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
    setTab("join");
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
      <div className="mx-auto max-w-5xl">
        <header data-motion="header" className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs tracking-[0.28em] text-studio-dim uppercase">
              <Radio className="h-3.5 w-3.5 text-studio-accent" aria-hidden />
              MiniDAW Collaborative
            </p>
            <GradientText as="h1" className="font-heading mt-2 text-4xl font-bold tracking-tight md:text-5xl">
              DAW Live
            </GradientText>
            <p className="mt-3 max-w-xl text-sm text-studio-mist md:text-base">
              Salas de sesión y colaboración en tiempo real. Unite con room id + password.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StudioButton variant="ghost" className="text-xs">
              <CircleHelp className="h-4 w-4" aria-hidden />
              Cómo funciona
            </StudioButton>
            {canCreate ? (
              <StudioButton variant="primary" className="text-xs" onClick={() => setTab("host")}>
                <Plus className="h-4 w-4" aria-hidden />
                Crear sala
              </StudioButton>
            ) : null}
            <span className="rounded-full border border-white/10 bg-studio-elevated/60 px-3 py-1.5 text-xs text-studio-dim backdrop-blur-sm">
              {backend === "supabase" ? "Supabase" : "Local browser"}
            </span>
            {hostMode ? (
              <StudioButton
                variant="ghost"
                className="text-xs"
                onClick={() => {
                  lockStudio();
                  onHostModeChange(false);
                  setTab("join");
                }}
              >
                Exit host
              </StudioButton>
            ) : null}
          </div>
        </header>

        <div data-motion="create" className="mb-6">
          <InfoBanner title="Tecnología de baja latencia">
            Web Audio + Direct Monitor para feel local. Control por Supabase Realtime; media WebRTC en
            roadmap. Medí path ms en Diagnostics — no confundas con guitarra→oído completo.
          </InfoBanner>
        </div>

        <div data-motion="create" className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <PillTabs
            tabs={[
              { id: "join", label: "Unirse a sala" },
              { id: "host", label: hostMode ? "Host · crear" : "Host · unlock" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === "join" ? (
          <GlassCard data-motion="create" className="mb-8" padding="p-5">
            <h2 className="font-heading text-sm font-semibold text-studio-fog">Unirse</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr_auto]">
              <input
                className="studio-input"
                value={joinId}
                onChange={(event) => setJoinId(event.target.value)}
                placeholder="Session id (UUID)"
                aria-label="Session id"
              />
              <input
                type="password"
                className="studio-input"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="Room password"
                aria-label="Room password"
                autoComplete="current-password"
              />
              <StudioButton
                variant="primary"
                disabled={busy || joinId.trim().length < 8 || joinCode.trim().length < 4}
                onClick={() => void handleJoin()}
              >
                Unirse
              </StudioButton>
            </div>
          </GlassCard>
        ) : hostMode ? (
          <GlassCard className="mb-8" padding="p-5">
            <h2 className="font-heading text-sm font-semibold text-studio-fog">Nueva sesión</h2>
            {!isHostCreateEnabled() ? (
              <p className="mt-3 text-sm text-studio-amber">
                This build has no `VITE_STUDIO_ACCESS_KEY`. Set it in Cloudflare Pages and rebuild.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <input
                  className="studio-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Session name"
                  aria-label="Session name"
                />
                <input
                  type="password"
                  className="studio-input"
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value)}
                  placeholder="Room password (min 4)"
                  aria-label="Room password"
                  autoComplete="new-password"
                />
                <StudioButton
                  variant="primary"
                  disabled={busy || name.trim().length === 0 || roomCode.trim().length < 4}
                  onClick={() => void handleCreate()}
                >
                  Create & open
                </StudioButton>
              </div>
            )}
          </GlassCard>
        ) : (
          <GlassCard className="mb-8 border-dashed" padding="p-5">
            <h2 className="font-heading text-sm font-semibold text-studio-fog">Desbloquear host</h2>
            <p className="mt-2 text-xs text-studio-dim">
              Required to create rooms and list recent sessions. Key in `VITE_STUDIO_ACCESS_KEY` — see
              `docs/ACCESS.md`.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="password"
                className="studio-input flex-1"
                value={hostKey}
                onChange={(event) => setHostKey(event.target.value)}
                placeholder="Host key"
                aria-label="Host key"
              />
              <StudioButton variant="outline" onClick={handleHostUnlock}>
                Unlock host tools
              </StudioButton>
            </div>
          </GlassCard>
        )}

        {error ? (
          <p className="mb-6 rounded-xl border border-studio-amber/30 bg-studio-amber/10 px-4 py-3 text-sm text-studio-amber" role="alert">
            {error}
          </p>
        ) : null}

        {hostMode ? (
          <section>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-heading text-sm font-semibold text-studio-fog">Salas disponibles</h2>
              <button
                type="button"
                className="text-xs text-studio-accent underline-offset-2 hover:underline"
                onClick={() => void refresh()}
              >
                Refresh
              </button>
            </div>
            {recent === null ? (
              <p className="text-sm text-studio-dim">Loading sessions…</p>
            ) : recent.length === 0 ? (
              <GlassCard data-motion="recent" padding="p-10" className="text-center text-sm text-studio-dim">
                No sessions yet — create one with Crear sala.
              </GlassCard>
            ) : (
              <ul className="space-y-3">
                {recent.map((item, index) => (
                  <SessionRoomCard
                    key={item.id}
                    name={item.name}
                    id={item.id}
                    bpm={item.bpm}
                    locked={!isRoomUnlocked(item.id)}
                    index={index}
                    busy={busy}
                    onOpen={() => void handleOpenListed(item.id)}
                    onDelete={() => void handleRemove(item.id)}
                  />
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
