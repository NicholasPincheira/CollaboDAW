import { useEffect, useMemo, useState } from "react";
import { AudioLabController } from "../application/audio-lab/audio-lab-controller.ts";
import { parseHashRoute, routeToHash, type AppRoute } from "../application/navigation/hash-route.ts";
import type { SessionCatalog, WorkSession } from "../domain/session/session-catalog.ts";
import type { SessionPresence } from "../domain/session/session-presence.ts";
import type { SessionBackend } from "../infrastructure/session/create-session-catalog.ts";
import { isRoomUnlocked, isStudioUnlocked } from "../infrastructure/session/studio-access.ts";
import { DashboardPage } from "./DashboardPage.tsx";
import { StudioWorkspace } from "./StudioWorkspace.tsx";

export function App({
  catalog,
  backend,
  createPresence,
}: {
  catalog: SessionCatalog;
  backend: SessionBackend;
  createPresence: () => SessionPresence;
}) {
  const [hostMode, setHostMode] = useState(() => isStudioUnlocked());
  const [route, setRoute] = useState<AppRoute>(() => parseHashRoute(window.location.hash || "#/"));
  const [session, setSession] = useState<WorkSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const controller = useMemo(() => new AudioLabController(), []);

  useEffect(() => {
    const onHash = (): void => {
      setRoute(parseHashRoute(window.location.hash));
    };
    window.addEventListener("hashchange", onHash);
    if (!window.location.hash) {
      window.location.hash = routeToHash({ name: "dashboard" });
    }
    return () => {
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  useEffect(() => {
    if (route.name !== "studio") return;
    if (!isRoomUnlocked(route.sessionId)) {
      return;
    }
    let cancelled = false;
    void catalog
      .get(route.sessionId)
      .then((found) => {
        if (cancelled) return;
        if (!found) {
          setSession(null);
          setLoadError("Session not found.");
          return;
        }
        setLoadError(null);
        setSession(found);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setSession(null);
        setLoadError(error instanceof Error ? error.message : "Could not open session.");
      });
    return () => {
      cancelled = true;
    };
  }, [catalog, route]);

  function navigate(next: AppRoute): void {
    window.location.hash = routeToHash(next);
    setRoute(next);
    if (next.name === "dashboard") {
      setSession(null);
      setLoadError(null);
    }
  }

  if (route.name === "dashboard") {
    return (
      <DashboardPage
        catalog={catalog}
        backend={backend}
        hostMode={hostMode}
        onHostModeChange={setHostMode}
        onOpen={(sessionId) => navigate({ name: "studio", sessionId })}
      />
    );
  }

  const roomLocked = route.name === "studio" && !isRoomUnlocked(route.sessionId);

  if (roomLocked || loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-studio-fog">
        <p role="alert">
          {roomLocked
            ? "Room is locked. Unlock it from the dashboard with the room password."
            : loadError}
        </p>
        <button
          type="button"
          className="rounded-xl bg-studio-fog px-4 py-2 text-sm font-semibold text-studio-bg"
          onClick={() => navigate({ name: "dashboard" })}
        >
          Back to sessions
        </button>
      </div>
    );
  }

  if (!session || session.id !== route.sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-studio-dim">
        Opening session…
      </div>
    );
  }

  return (
    <StudioWorkspace
      key={session.id}
      controller={controller}
      catalog={catalog}
      session={session}
      createPresence={createPresence}
      onBack={() => navigate({ name: "dashboard" })}
      onSessionUpdated={setSession}
    />
  );
}
