import { useEffect, useRef, useState } from "react";
import type { AudioLabController } from "../application/audio-lab/audio-lab-controller.ts";
import { diagnosticsFromAudioLab } from "../application/audio-lab/diagnostics-from-lab.ts";
import { projectBpm } from "../domain/project/create-empty-project.ts";
import type { SessionCatalog, WorkSession } from "../domain/session/session-catalog.ts";
import { AudioLabPanel } from "./AudioLabPanel.tsx";
import { DiagnosticsPanel } from "./DiagnosticsPanel.tsx";
import { playShellIntro } from "./shell-motion.ts";
import { useAudioLab } from "./useAudioLab.ts";

const TRACK_COLORS = ["bg-track-a", "bg-track-b", "bg-track-c", "bg-track-d"] as const;

export function StudioWorkspace({
  controller,
  catalog,
  session,
  onBack,
  onSessionUpdated,
}: {
  controller: AudioLabController;
  catalog: SessionCatalog;
  session: WorkSession;
  onBack: () => void;
  onSessionUpdated: (session: WorkSession) => void;
}) {
  const shellRef = useRef<HTMLElement>(null);
  const lab = useAudioLab(controller);
  const diagnostics = diagnosticsFromAudioLab(lab);
  const [name, setName] = useState(session.project.name);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [panel, setPanel] = useState<"lab" | "diagnostics">("lab");
  const bpm = projectBpm(session.project);
  const signature = `${session.project.timeSignature.numerator}/${session.project.timeSignature.denominator}`;

  useEffect(() => {
    let cancelled = false;
    let animation: { kill: () => void } | null = null;
    void playShellIntro(shellRef.current).then((tween) => {
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
  }, []);

  async function handleSave(): Promise<void> {
    setSaving(true);
    setSaveError(null);
    try {
      const next = await catalog.save({
        ...session,
        name,
        project: { ...session.project, name },
      });
      onSessionUpdated(next);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-studio-bg text-studio-fog">
      <section ref={shellRef} className="mx-auto flex min-h-screen max-w-[1400px] flex-col" aria-label="Studio">
        <header className="flex flex-wrap items-center gap-3 border-b border-studio-line bg-studio-elevated/90 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-studio-line px-3 py-1.5 text-xs text-studio-mist"
          >
            Sessions
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] tracking-[0.22em] text-studio-amber uppercase">MiniDAW</p>
            <input
              className="w-full max-w-md truncate bg-transparent text-lg font-semibold outline-none"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-label="Session name"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-studio-mist">
            <span className="rounded-full border border-studio-line px-2.5 py-1">{bpm} bpm</span>
            <span className="rounded-full border border-studio-line px-2.5 py-1">{signature}</span>
            <span className="rounded-full border border-studio-line px-2.5 py-1">
              {lab.status === "running" ? "Audio live" : "Audio idle"}
            </span>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="rounded-lg bg-studio-fog px-4 py-2 text-sm font-semibold text-studio-bg disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-studio-line px-4 py-3">
          {["Rewind", "Play", "Stop", "Record"].map((label) => (
            <button
              key={label}
              type="button"
              disabled
              className="min-w-16 rounded-full border border-studio-line px-4 py-2 text-sm text-studio-dim"
            >
              {label}
            </button>
          ))}
          <p className="text-sm tabular-nums text-studio-mist">00:00.0</p>
          <p className="text-xs text-studio-dim">Transport arrives with the musical clock slice.</p>
          {saveError ? (
            <p className="text-xs text-studio-amber" role="alert">
              {saveError}
            </p>
          ) : null}
        </div>

        <div className="grid flex-1 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="border-b border-studio-line bg-studio-panel lg:border-r lg:border-b-0">
            <div className="flex items-center justify-between border-b border-studio-line px-4 py-3">
              <h2 className="text-xs tracking-[0.16em] text-studio-mist uppercase">Tracks</h2>
              <button type="button" disabled className="rounded-lg border border-studio-line px-2 py-1 text-xs text-studio-dim">
                + Add track
              </button>
            </div>
            <ul className="space-y-2 p-3">
              {lab.channelMap.entries.length === 0 ? (
                <li className="rounded-xl border border-dashed border-studio-line px-3 py-6 text-sm text-studio-dim">
                  Start the Audio Lab to seed logical inputs as tracks.
                </li>
              ) : (
                lab.channelMap.entries.map((entry, index) => (
                  <li
                    key={entry.label}
                    className="rounded-xl border border-studio-line bg-studio-elevated p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${TRACK_COLORS[index % TRACK_COLORS.length]}`} />
                      <p className="truncate text-sm font-medium">{entry.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" disabled className="rounded-md border border-studio-line px-2 py-1 text-[11px] text-studio-dim">
                        M
                      </button>
                      <button type="button" disabled className="rounded-md border border-studio-line px-2 py-1 text-[11px] text-studio-dim">
                        S
                      </button>
                      <div className="h-1.5 flex-1 rounded-full bg-studio-bg">
                        <div className="h-1.5 w-2/3 rounded-full bg-studio-mist/40" />
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-studio-dim">
                      ch {entry.streamChannel === null ? "?" : entry.streamChannel} · {entry.source}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </aside>

          <div className="flex min-h-[28rem] flex-col">
            <div className="border-b border-studio-line px-4 py-2 text-xs text-studio-dim">
              0 · 1 · 2 · 3 · 4 · 5 · 6 · 7 · 8
            </div>
            <div className="relative flex-1 bg-[linear-gradient(to_right,rgba(42,49,60,0.35)_1px,transparent_1px)] bg-size-[48px_100%] p-4">
              <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border border-dashed border-studio-line bg-studio-elevated/40 px-6 text-center text-sm text-studio-dim">
                Drop loops and recorded takes here after Milestone 4. For now, prove input capture below.
              </div>
            </div>

            <div className="border-t border-studio-line bg-studio-panel">
              <div className="flex gap-2 border-b border-studio-line px-4 py-2">
                <button
                  type="button"
                  className={`rounded-lg px-3 py-1.5 text-xs ${panel === "lab" ? "bg-studio-fog text-studio-bg" : "text-studio-mist"}`}
                  onClick={() => setPanel("lab")}
                >
                  Device / Audio Lab
                </button>
                <button
                  type="button"
                  className={`rounded-lg px-3 py-1.5 text-xs ${panel === "diagnostics" ? "bg-studio-fog text-studio-bg" : "text-studio-mist"}`}
                  onClick={() => setPanel("diagnostics")}
                >
                  Diagnostics
                </button>
              </div>
              <div className="max-h-[42vh] overflow-auto p-4">
                {panel === "lab" ? (
                  <AudioLabPanel controller={controller} snapshot={lab} />
                ) : (
                  <DiagnosticsPanel snapshot={diagnostics} />
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
