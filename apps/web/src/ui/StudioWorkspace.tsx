import { useEffect, useRef, useState } from "react";
import type { AudioLabController } from "../application/audio-lab/audio-lab-controller.ts";
import { diagnosticsFromAudioLab } from "../application/audio-lab/diagnostics-from-lab.ts";
import { projectBpm } from "../domain/project/create-empty-project.ts";
import type { SessionCatalog, WorkSession } from "../domain/session/session-catalog.ts";
import type { SessionPresence } from "../domain/session/session-presence.ts";
import type { TempoMapEntry } from "../domain/project/project-document.ts";
import type { LatencyMode } from "../infrastructure/audio/web-audio-lab-engine.ts";
import { AudioLabPanel } from "./AudioLabPanel.tsx";
import { DiagnosticsPanel } from "./DiagnosticsPanel.tsx";
import { PresenceHeader } from "./PresenceHeader.tsx";
import { playShellIntro } from "./shell-motion.ts";
import { useAudioLab } from "./useAudioLab.ts";

const TRACK_COLORS = ["bg-track-a", "bg-track-b", "bg-track-c", "bg-track-d"] as const;
const ROW_H = "h-16";

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
  const [drawer, setDrawer] = useState<"closed" | "lab" | "diagnostics">("lab");
  const [selectedSection, setSelectedSection] = useState(0);

  const baseMs = lab.diagnostics.baseLatencySeconds;
  const outMs = lab.diagnostics.outputLatencySeconds;
  const pathMs =
    baseMs === null && outMs === null
      ? null
      : ((baseMs ?? 0) + (outMs ?? 0)) * 1000;

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
    const map = tempoMap.length > 0 ? [...tempoMap] : [{ startBeat: 0, bpm }];
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
      setDrawer("lab");
      return;
    }
    setSaveError(null);
    controller.startClick(bpm, numerator);
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

  const tracks = lab.channelMap.entries;

  return (
    <div className="h-dvh overflow-hidden bg-studio-bg text-studio-fog">
      <section
        ref={shellRef}
        className="mx-auto flex h-full max-w-[1600px] flex-col overflow-hidden"
        aria-label="Studio"
      >
        {/* Header */}
        <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-studio-line bg-studio-elevated/95 px-3 py-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-studio-line px-2.5 py-1 text-xs text-studio-mist"
          >
            Sessions
          </button>
          <div className="min-w-0">
            <p className="text-[9px] tracking-[0.2em] text-studio-amber uppercase">MiniDAW</p>
            <input
              className="w-36 truncate bg-transparent text-base font-semibold outline-none md:w-48"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-label="Session name"
            />
          </div>
          <PresenceHeader sessionId={session.id} createPresence={createPresence} />
          <label className="flex items-center gap-1 rounded-full border border-studio-line px-2 py-0.5 text-xs">
            <input
              type="number"
              min={30}
              max={300}
              className="w-10 bg-transparent text-right outline-none"
              value={bpm}
              onChange={(event) => setBpm(Number(event.target.value) || 120)}
              aria-label="BPM"
            />
            bpm
          </label>
          <label className="flex items-center gap-1 rounded-full border border-studio-line px-2 py-0.5 text-xs">
            <input
              type="number"
              min={1}
              max={16}
              className="w-7 bg-transparent text-right outline-none"
              value={numerator}
              onChange={(event) => setNumerator(Number(event.target.value) || 4)}
              aria-label="Numerator"
            />
            /
            <input
              type="number"
              min={1}
              max={16}
              className="w-7 bg-transparent outline-none"
              value={denominator}
              onChange={(event) => setDenominator(Number(event.target.value) || 4)}
              aria-label="Denominator"
            />
          </label>
          <LatencyHud
            pathMs={pathMs}
            baseMs={baseMs}
            outMs={outMs}
            mode={lab.latencyMode}
            sampleRate={lab.diagnostics.sampleRate}
            preferredSampleRate={lab.preferredSampleRate}
            running={lab.status === "running"}
            onMode={(mode) => void controller.setLatencyMode(mode)}
            onSampleRate={(rate) => void controller.setPreferredSampleRate(rate)}
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void persist()}
            className="rounded-lg bg-studio-fog px-3 py-1.5 text-xs font-semibold text-studio-bg disabled:opacity-50"
          >
            {saving ? "…" : "Save"}
          </button>
        </header>

        {/* Transport */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-studio-line px-3 py-1.5">
          <button type="button" disabled className="rounded-full border border-studio-line px-3 py-1 text-xs text-studio-dim">
            Rewind
          </button>
          <button
            type="button"
            onClick={handlePlay}
            className="rounded-full border border-studio-line px-3 py-1 text-xs hover:border-studio-accent"
          >
            Play
          </button>
          <button
            type="button"
            onClick={() => controller.stopClick()}
            className="rounded-full border border-studio-line px-3 py-1 text-xs hover:border-studio-amber"
          >
            Stop
          </button>
          <button type="button" disabled className="rounded-full border border-studio-line px-3 py-1 text-xs text-studio-dim">
            Record
          </button>
          <span className="text-xs tabular-nums text-studio-mist">
            {lab.clickPlaying ? "Click ▶" : "00:00.0"}
          </span>
          {saveError ? (
            <span className="text-xs text-studio-amber" role="alert">
              {saveError}
            </span>
          ) : (
            <span className="text-[11px] text-studio-dim">
              Tip: less delay = Direct Monitor on Behringer + software monitor muted · or Primary = interface
            </span>
          )}
        </div>

        {/* Tempo map ABOVE tracks (BandLab-style ruler) */}
        <div className="flex shrink-0 items-stretch border-b border-studio-line">
          <div className="flex w-56 shrink-0 items-center justify-between gap-2 border-r border-studio-line bg-studio-panel px-3 py-1.5">
            <span className="text-[10px] tracking-[0.14em] text-studio-dim uppercase">Sections</span>
            <button
              type="button"
              className="rounded border border-studio-line px-1.5 py-0.5 text-[10px] text-studio-mist"
              onClick={addTempoSection}
            >
              + Tempo
            </button>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto bg-studio-elevated/40 px-2 py-1.5">
            {tempoMap.map((entry, index) => (
              <button
                key={`${entry.startBeat}-${index}`}
                type="button"
                onClick={() => {
                  setSelectedSection(index);
                  setBpm(entry.bpm);
                }}
                className={`shrink-0 rounded-lg border px-2 py-1 text-left text-[11px] ${
                  selectedSection === index
                    ? "border-studio-accent bg-studio-accent/10"
                    : "border-studio-line bg-studio-bg/50"
                }`}
              >
                <span className="font-semibold">{entry.bpm}</span>
                <span className="ml-1 text-studio-dim">@ {entry.startBeat}</span>
              </button>
            ))}
            {tempoMap[selectedSection] ? (
              <div className="ml-auto flex shrink-0 items-center gap-2 text-[11px] text-studio-mist">
                <label className="flex items-center gap-1">
                  beat
                  <input
                    type="number"
                    min={0}
                    className="w-14 rounded border border-studio-line bg-studio-bg px-1 py-0.5"
                    value={tempoMap[selectedSection]!.startBeat}
                    onChange={(event) =>
                      updateSelectedSection({ startBeat: Number(event.target.value) || 0 })
                    }
                  />
                </label>
                <label className="flex items-center gap-1">
                  bpm
                  <input
                    type="number"
                    min={30}
                    max={300}
                    className="w-14 rounded border border-studio-line bg-studio-bg px-1 py-0.5"
                    value={tempoMap[selectedSection]!.bpm}
                    onChange={(event) => {
                      const nextBpm = Number(event.target.value) || 120;
                      updateSelectedSection({ bpm: nextBpm });
                      if (selectedSection === 0) setBpm(nextBpm);
                    }}
                  />
                </label>
              </div>
            ) : null}
          </div>
        </div>

        {/* Tracks left + clip lanes right */}
        <div className="grid min-h-0 flex-1 grid-cols-[14rem_minmax(0,1fr)] overflow-hidden">
          <aside className="flex min-h-0 flex-col overflow-y-auto border-r border-studio-line bg-studio-panel">
            <div className="sticky top-0 z-10 border-b border-studio-line bg-studio-panel px-3 py-1.5 text-[10px] tracking-[0.14em] text-studio-dim uppercase">
              Tracks
            </div>
            {tracks.length === 0 ? (
              <p className="p-3 text-xs text-studio-dim">Open Audio Lab → Start audio</p>
            ) : (
              tracks.map((entry, index) => {
                const streamChannel = entry.streamChannel ?? index;
                const monitor = lab.channelMonitors[streamChannel] ?? {
                  muted: false,
                  solo: false,
                  gain: 1,
                };
                return (
                  <div
                    key={entry.label}
                    className={`flex ${ROW_H} flex-col justify-center gap-1 border-b border-studio-line px-2`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${TRACK_COLORS[index % TRACK_COLORS.length]}`} />
                      <span className="truncate text-xs font-medium">{entry.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className={`rounded px-1.5 text-[10px] ${monitor.muted ? "bg-studio-amber/20 text-studio-amber" : "border border-studio-line text-studio-mist"}`}
                        onClick={() =>
                          controller.setChannelMonitor(streamChannel, { muted: !monitor.muted })
                        }
                      >
                        M
                      </button>
                      <button
                        type="button"
                        className={`rounded px-1.5 text-[10px] ${monitor.solo ? "bg-studio-accent/20 text-studio-accent" : "border border-studio-line text-studio-mist"}`}
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
                        className="h-1 flex-1 accent-studio-fog"
                        aria-label={`${entry.label} gain`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </aside>

          <div className="flex min-h-0 min-w-0 flex-col overflow-auto bg-[linear-gradient(to_right,rgba(42,49,60,0.28)_1px,transparent_1px)] bg-size-[40px_100%]">
            <div className="sticky top-0 z-10 border-b border-studio-line bg-studio-bg/90 px-3 py-1 text-[10px] text-studio-dim backdrop-blur">
              1 · 2 · 3 · 4 · 5 · 6 · 7 · 8 · clip lanes (recordings land here)
            </div>
            {tracks.length === 0 ? (
              <div className={`flex ${ROW_H} items-center px-4 text-xs text-studio-dim`}>
                Empty arrangement — start Audio Lab to create lanes
              </div>
            ) : (
              tracks.map((entry, index) => (
                <div
                  key={`lane-${entry.label}`}
                  className={`flex ${ROW_H} items-center border-b border-studio-line/80 px-3`}
                >
                  <div className="flex h-10 w-full items-center justify-center rounded-lg border border-dashed border-studio-line/70 bg-studio-elevated/20 text-[11px] text-studio-dim">
                    {entry.label} lane · drop / record takes (Milestone 4)
                  </div>
                  <span
                    className={`ml-2 hidden h-2 w-2 rounded-full sm:inline-block ${TRACK_COLORS[index % TRACK_COLORS.length]}`}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom drawer — does not force page scroll */}
        <div className="shrink-0 border-t border-studio-line bg-studio-panel">
          <div className="flex items-center gap-2 px-3 py-1">
            <button
              type="button"
              className={`rounded px-2 py-1 text-[11px] ${drawer === "lab" ? "bg-studio-fog text-studio-bg" : "text-studio-mist"}`}
              onClick={() => setDrawer(drawer === "lab" ? "closed" : "lab")}
            >
              Device / Audio Lab
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 text-[11px] ${drawer === "diagnostics" ? "bg-studio-fog text-studio-bg" : "text-studio-mist"}`}
              onClick={() => setDrawer(drawer === "diagnostics" ? "closed" : "diagnostics")}
            >
              Diagnostics
            </button>
            <span className="text-[10px] text-studio-dim">
              {lab.status} · sink {lab.sinkStatus} · dual {lab.secondarySinkStatus}
            </span>
            {drawer !== "closed" ? (
              <button
                type="button"
                className="ml-auto text-[10px] text-studio-dim underline"
                onClick={() => setDrawer("closed")}
              >
                Collapse
              </button>
            ) : null}
          </div>
          {drawer !== "closed" ? (
            <div className="max-h-[28vh] overflow-auto border-t border-studio-line px-3 py-2">
              {drawer === "lab" ? (
                <AudioLabPanel controller={controller} snapshot={lab} compact />
              ) : (
                <DiagnosticsPanel snapshot={diagnostics} />
              )}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function LatencyHud({
  pathMs,
  baseMs,
  outMs,
  mode,
  sampleRate,
  preferredSampleRate,
  running,
  onMode,
  onSampleRate,
}: {
  pathMs: number | null;
  baseMs: number | null;
  outMs: number | null;
  mode: LatencyMode;
  sampleRate: number | null;
  preferredSampleRate: number | null;
  running: boolean;
  onMode: (mode: LatencyMode) => void;
  onSampleRate: (rate: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
      <span
        className={`rounded-full border px-2 py-0.5 tabular-nums ${
          pathMs !== null && pathMs > 40
            ? "border-studio-amber/60 text-studio-amber"
            : "border-studio-accent/50 text-studio-accent"
        }`}
        title="Browser-reported base+output only — not full guitar→ear"
      >
        {running && pathMs !== null ? `${pathMs.toFixed(0)} ms path` : "— ms"}
      </span>
      <span className="hidden text-studio-dim sm:inline">
        base {baseMs !== null ? `${(baseMs * 1000).toFixed(0)}` : "—"} · out{" "}
        {outMs !== null ? `${(outMs * 1000).toFixed(0)}` : "—"} · {sampleRate ?? "—"} Hz
      </span>
      {(["live", "record", "rehearsal", "mix"] as const).map((item) => (
        <button
          key={item}
          type="button"
          className={`rounded border px-1.5 py-0.5 capitalize ${
            mode === item ? "border-studio-accent text-studio-accent" : "border-studio-line text-studio-dim"
          }`}
          onClick={() => onMode(item)}
        >
          {item}
        </button>
      ))}
      <select
        className="rounded border border-studio-line bg-studio-bg px-1 py-0.5 text-studio-mist"
        value={preferredSampleRate ?? ""}
        onChange={(event) => {
          const value = event.target.value;
          onSampleRate(value ? Number(value) : null);
        }}
        aria-label="Preferred sample rate"
      >
        <option value="48000">48k</option>
        <option value="44100">44.1k</option>
        <option value="">auto</option>
      </select>
    </div>
  );
}
