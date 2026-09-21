import { useEffect, useRef, useState } from "react";
import type { AudioLabController } from "../application/audio-lab/audio-lab-controller.ts";
import { diagnosticsFromAudioLab } from "../application/audio-lab/diagnostics-from-lab.ts";
import { projectBpm } from "../domain/project/create-empty-project.ts";
import type { SessionCatalog, WorkSession } from "../domain/session/session-catalog.ts";
import type { SessionPresence } from "../domain/session/session-presence.ts";
import type { TempoMapEntry } from "../domain/project/project-document.ts";
import { AudioLabPanel } from "./AudioLabPanel.tsx";
import { DiagnosticsPanel } from "./DiagnosticsPanel.tsx";
import { PresenceHeader } from "./PresenceHeader.tsx";
import { playShellIntro } from "./shell-motion.ts";
import { useAudioLab } from "./useAudioLab.ts";

const TRACK_COLORS = ["bg-track-a", "bg-track-b", "bg-track-c", "bg-track-d"] as const;

export function StudioWorkspace({
  controller,
  catalog,
  session,
  createPresence,
  onBack,
  onSessionUpdated,
}: {
  controller: AudioLabController;
  catalog: SessionCatalog;
  session: WorkSession;
  createPresence: () => SessionPresence;
  onBack: () => void;
  onSessionUpdated: (session: WorkSession) => void;
}) {
  const shellRef = useRef<HTMLElement>(null);
  const lab = useAudioLab(controller);
  const diagnostics = diagnosticsFromAudioLab(lab);
  const [name, setName] = useState(session.project.name);
  const [bpm, setBpm] = useState(projectBpm(session.project));
  const [numerator, setNumerator] = useState(session.project.timeSignature.numerator);
  const [denominator, setDenominator] = useState(session.project.timeSignature.denominator);
  const [tempoMap, setTempoMap] = useState<TempoMapEntry[]>(session.project.tempoMap);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [panel, setPanel] = useState<"lab" | "diagnostics">("lab");
  const [selectedSection, setSelectedSection] = useState(0);

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
      controller.stopClick();
    };
  }, [controller]);

  useEffect(() => {
    controller.updateClickTempo(bpm, numerator);
  }, [bpm, numerator, controller]);

  function buildProject() {
    const map = tempoMap.length > 0 ? tempoMap : [{ startBeat: 0, bpm }];
    map[0] = { ...map[0]!, bpm };
    return {
      ...session.project,
      name,
      timeSignature: { numerator, denominator },
      tempoMap: map,
    };
  }

  async function persist(): Promise<void> {
    setSaving(true);
    setSaveError(null);
    try {
      const next = await catalog.save({
        ...session,
        name,
        project: buildProject(),
      });
      onSessionUpdated(next);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function handlePlay(): void {
    if (lab.status !== "running") {
      setSaveError("Start audio in the Audio Lab before Play.");
      return;
    }
    setSaveError(null);
    controller.startClick(bpm, numerator);
  }

  function handleStop(): void {
    controller.stopClick();
  }

  function addTempoSection(): void {
    const last = tempoMap[tempoMap.length - 1];
    const startBeat = (last?.startBeat ?? 0) + numerator * 4;
    const next = [...tempoMap, { startBeat, bpm }];
    setTempoMap(next);
    setSelectedSection(next.length - 1);
  }

  function updateSelectedSection(patch: Partial<TempoMapEntry>): void {
    setTempoMap((current) =>
      current.map((entry, index) => (index === selectedSection ? { ...entry, ...patch } : entry)),
    );
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
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.22em] text-studio-amber uppercase">MiniDAW</p>
            <input
              className="w-full max-w-[12rem] truncate bg-transparent text-lg font-semibold outline-none md:max-w-xs"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-label="Session name"
            />
          </div>
          <PresenceHeader sessionId={session.id} createPresence={createPresence} />
          <div className="flex flex-wrap items-center gap-2 text-xs text-studio-mist">
            <label className="flex items-center gap-1 rounded-full border border-studio-line px-2 py-1">
              <input
                type="number"
                min={30}
                max={300}
                className="w-12 bg-transparent text-right outline-none"
                value={bpm}
                onChange={(event) => setBpm(Number(event.target.value) || 120)}
                aria-label="BPM"
              />
              bpm
            </label>
            <label className="flex items-center gap-1 rounded-full border border-studio-line px-2 py-1">
              <input
                type="number"
                min={1}
                max={16}
                className="w-8 bg-transparent text-right outline-none"
                value={numerator}
                onChange={(event) => setNumerator(Number(event.target.value) || 4)}
                aria-label="Time signature numerator"
              />
              /
              <input
                type="number"
                min={1}
                max={16}
                className="w-8 bg-transparent outline-none"
                value={denominator}
                onChange={(event) => setDenominator(Number(event.target.value) || 4)}
                aria-label="Time signature denominator"
              />
            </label>
            <span className="rounded-full border border-studio-line px-2.5 py-1">
              {lab.status === "running" ? "Audio live" : "Audio idle"}
            </span>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => void persist()}
            className="rounded-lg bg-studio-fog px-4 py-2 text-sm font-semibold text-studio-bg disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b border-studio-line px-4 py-3">
          <button
            type="button"
            className="min-w-16 rounded-full border border-studio-line px-4 py-2 text-sm text-studio-dim"
            disabled
            title="Rewind arrives with clip timeline"
          >
            Rewind
          </button>
          <button
            type="button"
            onClick={handlePlay}
            className="min-w-16 rounded-full border border-studio-line px-4 py-2 text-sm text-studio-fog hover:border-studio-accent"
          >
            Play
          </button>
          <button
            type="button"
            onClick={handleStop}
            className="min-w-16 rounded-full border border-studio-line px-4 py-2 text-sm text-studio-fog hover:border-studio-amber"
          >
            Stop
          </button>
          <button
            type="button"
            className="min-w-16 rounded-full border border-studio-line px-4 py-2 text-sm text-studio-dim"
            disabled
            title="Recording is Milestone 4"
          >
            Record
          </button>
          <p className="text-sm tabular-nums text-studio-mist">
            {lab.clickPlaying ? "Click running" : "00:00.0"}
          </p>
          <p className="text-xs text-studio-dim">Local click · shared audio sync comes later via WebRTC</p>
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
              <span className="text-[11px] text-studio-dim">from Audio Lab inputs</span>
            </div>
            <ul className="space-y-2 p-3">
              {lab.channelMap.entries.length === 0 ? (
                <li className="rounded-xl border border-dashed border-studio-line px-3 py-6 text-sm text-studio-dim">
                  Start the Audio Lab to seed logical inputs as tracks.
                </li>
              ) : (
                lab.channelMap.entries.map((entry, index) => {
                  const streamChannel = entry.streamChannel ?? index;
                  const monitor = lab.channelMonitors[streamChannel] ?? {
                    muted: false,
                    solo: false,
                    gain: 1,
                  };
                  return (
                    <li
                      key={entry.label}
                      className="rounded-xl border border-studio-line bg-studio-elevated p-3"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${TRACK_COLORS[index % TRACK_COLORS.length]}`} />
                        <p className="truncate text-sm font-medium">{entry.label}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className={`rounded-md border px-2 py-1 text-[11px] ${monitor.muted ? "border-studio-amber bg-studio-amber/20 text-studio-amber" : "border-studio-line text-studio-mist"}`}
                          onClick={() =>
                            controller.setChannelMonitor(streamChannel, { muted: !monitor.muted })
                          }
                        >
                          M
                        </button>
                        <button
                          type="button"
                          className={`rounded-md border px-2 py-1 text-[11px] ${monitor.solo ? "border-studio-accent bg-studio-accent/20 text-studio-accent" : "border-studio-line text-studio-mist"}`}
                          onClick={() =>
                            controller.setChannelMonitor(streamChannel, { solo: !monitor.solo })
                          }
                        >
                          S
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={Math.round(monitor.gain * 100)}
                          onChange={(event) =>
                            controller.setChannelMonitor(streamChannel, {
                              gain: Number(event.target.value) / 100,
                            })
                          }
                          className="h-1.5 flex-1 accent-studio-fog"
                          aria-label={`${entry.label} gain`}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-studio-dim">
                        ch {entry.streamChannel === null ? "?" : entry.streamChannel} · {entry.source}
                      </p>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          <div className="flex min-h-[28rem] flex-col">
            <div className="flex items-center justify-between gap-2 border-b border-studio-line px-4 py-2 text-xs text-studio-dim">
              <span>Tempo map · click a section · drag comes with recorded clips later</span>
              <button
                type="button"
                className="rounded-lg border border-studio-line px-2 py-1 text-studio-mist"
                onClick={addTempoSection}
              >
                + Tempo section
              </button>
            </div>
            <div className="relative flex-1 bg-[linear-gradient(to_right,rgba(42,49,60,0.35)_1px,transparent_1px)] bg-size-[48px_100%] p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {tempoMap.map((entry, index) => (
                  <button
                    key={`${entry.startBeat}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedSection(index);
                      setBpm(entry.bpm);
                    }}
                    className={`rounded-xl border px-3 py-2 text-left text-xs ${
                      selectedSection === index
                        ? "border-studio-accent bg-studio-accent/10 text-studio-fog"
                        : "border-studio-line bg-studio-elevated/60 text-studio-mist"
                    }`}
                    style={{ minWidth: `${Math.max(4, entry.bpm / 8)}rem` }}
                  >
                    <p className="font-semibold">{entry.bpm} bpm</p>
                    <p className="text-[10px] text-studio-dim">beat {entry.startBeat}</p>
                  </button>
                ))}
              </div>
              {tempoMap[selectedSection] ? (
                <div className="rounded-2xl border border-studio-line bg-studio-elevated/70 p-4">
                  <p className="text-xs tracking-[0.14em] text-studio-dim uppercase">Selected section</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <label className="text-xs text-studio-mist">
                      Start beat
                      <input
                        type="number"
                        min={0}
                        className="mt-1 block w-24 rounded-lg border border-studio-line bg-studio-bg px-2 py-1.5 text-sm"
                        value={tempoMap[selectedSection]!.startBeat}
                        onChange={(event) =>
                          updateSelectedSection({ startBeat: Number(event.target.value) || 0 })
                        }
                      />
                    </label>
                    <label className="text-xs text-studio-mist">
                      BPM
                      <input
                        type="number"
                        min={30}
                        max={300}
                        className="mt-1 block w-24 rounded-lg border border-studio-line bg-studio-bg px-2 py-1.5 text-sm"
                        value={tempoMap[selectedSection]!.bpm}
                        onChange={(event) => {
                          const nextBpm = Number(event.target.value) || 120;
                          updateSelectedSection({ bpm: nextBpm });
                          if (selectedSection === 0) setBpm(nextBpm);
                        }}
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-xs text-studio-dim">
                    Audio clips / drag-drop takes arrive with Milestone 4. This map already drives the local click.
                  </p>
                </div>
              ) : null}
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
