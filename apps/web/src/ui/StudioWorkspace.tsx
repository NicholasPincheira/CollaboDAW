import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Circle,
  Play,
  Repeat,
  Save,
  SkipBack,
  SkipForward,
  Square,
} from "lucide-react";
import type { AudioLabController } from "../application/audio-lab/audio-lab-controller.ts";
import { diagnosticsFromAudioLab } from "../application/audio-lab/diagnostics-from-lab.ts";
import {
  autoTuneMonitorPath,
  buildDebugBundle,
  type AutoTuneReport,
} from "../application/audio-lab/latency-lab.ts";
import { projectBpm } from "../domain/project/create-empty-project.ts";
import type { ControlPlaneProbe, ControlPlaneMetrics } from "../domain/session/control-plane-probe.ts";
import { emptyControlPlaneMetrics } from "../domain/session/control-plane-probe.ts";
import type { SessionCatalog, WorkSession } from "../domain/session/session-catalog.ts";
import type { SessionPresence } from "../domain/session/session-presence.ts";
import type { TempoMapEntry } from "../domain/project/project-document.ts";
import type { LatencyMode } from "../infrastructure/audio/web-audio-lab-engine.ts";
import {
  AI_ASSIST_OPTIONS,
  EXPERIENCE_PRESETS,
  hardwareDirectMonitorLabel,
  listPresetsByGroup,
  type AiAssistMode,
  type ExperiencePresetId,
  type SubjectiveFeelScore,
} from "../domain/audio/experience-presets.ts";
import { AudioLabPanel } from "./AudioLabPanel.tsx";
import { ChannelMixerStrip } from "./ChannelMixerStrip.tsx";
import { DiagnosticsPanel } from "./DiagnosticsPanel.tsx";
import { PresenceHeader } from "./PresenceHeader.tsx";
import { StudioBottomPanel, type StudioDrawerTab } from "./StudioBottomPanel.tsx";
import { TimelineLane } from "./TimelineLane.tsx";
import { GlassCard } from "./primitives/GlassCard.tsx";
import { GradientText } from "./primitives/GradientText.tsx";
import { playShellIntro } from "./shell-motion.ts";
import { useAudioLab } from "./useAudioLab.ts";

const ROW_H = "h-16";

export function StudioWorkspace({
  controller,
  catalog,
  session,
  createPresence,
  createControlPlaneProbe,
  onBack,
  onSessionUpdated,
}: {
  controller: AudioLabController;
  catalog: SessionCatalog;
  session: WorkSession;
  createPresence: () => SessionPresence;
  createControlPlaneProbe: () => ControlPlaneProbe;
  onBack: () => void;
  onSessionUpdated: (session: WorkSession) => void;
}) {
  const shellRef = useRef<HTMLElement>(null);
  const lab = useAudioLab(controller);
  const [control, setControl] = useState<ControlPlaneMetrics>(emptyControlPlaneMetrics);
  const [autoTune, setAutoTune] = useState<AutoTuneReport | null>(null);
  const [labBusy, setLabBusy] = useState(false);
  const probeRef = useRef<ControlPlaneProbe | null>(null);
  const diagnostics = diagnosticsFromAudioLab(lab, control);
  const [name, setName] = useState(session.project.name);
  const [bpm, setBpm] = useState(projectBpm(session.project));
  const [numerator, setNumerator] = useState(session.project.timeSignature.numerator);
  const [denominator, setDenominator] = useState(session.project.timeSignature.denominator);
  const [tempoMap, setTempoMap] = useState<TempoMapEntry[]>(session.project.tempoMap);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<StudioDrawerTab>("closed");
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
    const probe = createControlPlaneProbe();
    probeRef.current = probe;
    const stop = probe.subscribe(setControl);
    void probe.start(session.id).catch((error: unknown) => {
      setControl({
        ...emptyControlPlaneMetrics(),
        lastError: error instanceof Error ? error.message : "Probe failed to start.",
        updatedAt: new Date().toISOString(),
      });
    });
    return () => {
      stop();
      void probe.stop();
      probeRef.current = null;
    };
  }, [createControlPlaneProbe, session.id]);

  useEffect(() => {
    controller.updateClickTempo(bpm, numerator);
  }, [bpm, numerator, controller]);

  async function handleMeasureNetwork(): Promise<void> {
    setLabBusy(true);
    try {
      await probeRef.current?.measure(8);
    } finally {
      setLabBusy(false);
    }
  }

  async function handleAutoTune(): Promise<void> {
    setLabBusy(true);
    try {
      const report = await autoTuneMonitorPath(controller);
      setAutoTune(report);
    } finally {
      setLabBusy(false);
    }
  }

  async function handleCopyDebug(): Promise<void> {
    const json = buildDebugBundle({
      lab,
      control,
      autoTune,
      sessionId: session.id,
    });
    try {
      await navigator.clipboard.writeText(json);
      setSaveError(null);
      setAutoTune((prev) =>
        prev
          ? { ...prev, note: `${prev.note} · debug JSON copied.` }
          : {
              tried: [],
              best: null,
              applied: false,
              note: "Debug JSON copied to clipboard — paste it here in chat.",
            },
      );
    } catch {
      setSaveError("Could not copy debug JSON.");
    }
  }

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

  const isPlaying = lab.clickPlaying;

  return (
    <div className="h-dvh overflow-hidden bg-studio-bg text-studio-fog">
      <section
        ref={shellRef}
        className="relative mx-auto flex h-full max-w-[1600px] flex-col overflow-hidden px-2 pb-2 pt-2 md:px-3"
        aria-label="Studio"
      >
        <header className="mb-2 flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-white/8 bg-studio-panel/50 px-3 py-2 backdrop-blur-md">
          <button type="button" onClick={onBack} className="transport-btn text-studio-mist" aria-label="Back to sessions">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 border-r border-white/8 pr-3">
            <GradientText className="font-heading text-sm font-bold">DAW Live</GradientText>
            <input
              className="mt-0.5 w-36 truncate bg-transparent text-sm font-medium text-studio-fog outline-none md:w-48"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-label="Session name"
            />
          </div>
          <PresenceHeader sessionId={session.id} createPresence={createPresence} />
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-studio-bg/50 px-2 py-1 text-xs">
            <input
              type="number"
              min={30}
              max={300}
              className="w-10 bg-transparent text-right outline-none"
              value={bpm}
              onChange={(event) => setBpm(Number(event.target.value) || 120)}
              aria-label="BPM"
            />
            <span className="text-studio-dim">bpm</span>
            <span className="text-studio-dim">·</span>
            <input
              type="number"
              min={1}
              max={16}
              className="w-6 bg-transparent text-right outline-none"
              value={numerator}
              onChange={(event) => setNumerator(Number(event.target.value) || 4)}
              aria-label="Numerator"
            />
            <span className="text-studio-dim">/</span>
            <input
              type="number"
              min={1}
              max={16}
              className="w-6 bg-transparent outline-none"
              value={denominator}
              onChange={(event) => setDenominator(Number(event.target.value) || 4)}
              aria-label="Denominator"
            />
          </div>
          <LatencyHud
            pathMs={pathMs}
            baseMs={baseMs}
            outMs={outMs}
            mode={lab.latencyMode}
            sampleRate={lab.diagnostics.sampleRate}
            preferredSampleRate={lab.preferredSampleRate}
            experiencePresetId={lab.experiencePresetId}
            aiAssistMode={lab.aiAssistMode}
            monitoring={lab.monitoring}
            subjectiveFeel={lab.subjectiveFeel1to5}
            running={lab.status === "running"}
            onExperiencePreset={(id) => void controller.applyExperiencePreset(id)}
            onAiAssist={(mode) => controller.setAiAssistMode(mode)}
            onSubjectiveFeel={(score) => controller.setSubjectiveFeel(score)}
            onMode={(mode) => void controller.setLatencyMode(mode)}
            onSampleRate={(rate) => void controller.setPreferredSampleRate(rate)}
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void persist()}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-linear-to-r from-studio-accent to-cyan-400 px-3 py-1.5 text-xs font-semibold text-studio-bg disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" aria-hidden />
            {saving ? "…" : "Save"}
          </button>
        </header>

        <GlassCard padding="p-0" className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2">
            <h2 className="font-heading text-sm font-semibold text-studio-fog">Timeline</h2>
          </div>
          <div className="flex flex-wrap items-center gap-1 px-3 py-2">
            <button type="button" disabled className="transport-btn" aria-label="Rewind">
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handlePlay}
              className={`transport-btn ${isPlaying ? "transport-btn-active" : ""}`}
              aria-label={isPlaying ? "Stop click" : "Play click"}
            >
              {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <button
              type="button"
              disabled
              className="transport-btn"
              aria-label="Record (coming soon)"
            >
              <Circle className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => controller.stopClick()} className="transport-btn" aria-label="Stop">
              <Square className="h-3.5 w-3.5" />
            </button>
            <button type="button" disabled className="transport-btn" aria-label="Forward">
              <SkipForward className="h-4 w-4" />
            </button>
            <button type="button" disabled className="transport-btn" aria-label="Loop">
              <Repeat className="h-4 w-4" />
            </button>
            <span className="ml-2 font-mono text-xs tabular-nums text-studio-dim">
              {lab.clickPlaying ? "Click ▶" : "00:00 / —:—"}
            </span>
          </div>
          {saveError ? (
            <p className="w-full border-t border-white/5 px-4 py-2 text-xs text-studio-amber" role="alert">
              {saveError}
            </p>
          ) : (
            <p className="hidden w-full border-t border-white/5 px-4 py-2 text-[11px] text-studio-dim lg:block">
              Direct Monitor ON + software monitor off = mejor feel · Primary output = interfaz
            </p>
          )}
        </GlassCard>

        <div className="mb-2 flex shrink-0 items-stretch overflow-hidden rounded-xl border border-white/8 bg-studio-panel/40 backdrop-blur-sm">
          <div className="flex w-56 shrink-0 items-center justify-between gap-2 border-r border-white/8 px-3 py-1.5">
            <span className="text-[10px] tracking-[0.14em] text-studio-dim uppercase">Sections</span>
            <button
              type="button"
              className="rounded-lg border border-white/10 px-1.5 py-0.5 text-[10px] text-studio-accent hover:bg-studio-accent/10"
              onClick={addTempoSection}
            >
              + Tempo
            </button>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-2 py-1.5">
            {tempoMap.map((entry, index) => (
              <button
                key={`${entry.startBeat}-${index}`}
                type="button"
                onClick={() => {
                  setSelectedSection(index);
                  setBpm(entry.bpm);
                }}
                className={`shrink-0 rounded-lg border px-2 py-1 text-left text-[11px] transition-colors ${
                  selectedSection === index
                    ? "border-studio-accent/50 bg-studio-accent/15 text-studio-accent"
                    : "border-white/10 bg-studio-bg/40 text-studio-mist hover:border-white/20"
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

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden lg:grid-cols-[minmax(0,1fr)_18rem]">
          <GlassCard padding="p-0" className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="relative flex min-h-0 flex-1 flex-col overflow-auto bg-[linear-gradient(to_right,rgba(42,49,60,0.22)_1px,transparent_1px)] bg-size-[40px_100%]">
              <div className="sticky top-0 z-10 flex justify-between border-b border-white/8 bg-studio-panel/80 px-4 py-1.5 text-[10px] text-studio-dim backdrop-blur">
                <span>1 · 2 · 3 · 4 · 5 · 6 · 7 · 8</span>
                <span className="hidden sm:inline">Clip lanes · Milestone 4</span>
              </div>
              {tracks.length === 0 ? (
                <div className={`flex ${ROW_H} items-center px-4 text-xs text-studio-dim`}>
                  Empty arrangement — open Audio Lab below and start audio
                </div>
              ) : (
                tracks.map((entry, index) => (
                  <TimelineLane key={`lane-${entry.label}`} label={entry.label} index={index} rowHeightClass={ROW_H} />
                ))
              )}
              <div className="pointer-events-none absolute top-8 bottom-0 left-[28%] z-10 w-0.5 bg-red-500/60">
                <div className="absolute -top-1 -ml-1 h-2.5 w-2.5 rounded-full bg-red-500" />
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="p-0" className="flex min-h-0 max-h-[40dvh] flex-col overflow-hidden lg:max-h-none">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-2.5">
              <h3 className="font-heading text-sm font-semibold text-studio-fog">Mezclador</h3>
              <span className="text-[10px] text-studio-dim">{tracks.length} ch</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {tracks.length === 0 ? (
                <p className="p-4 text-xs text-studio-dim">Start audio in the bottom Audio Lab to populate channels.</p>
              ) : (
                tracks.map((entry, index) => {
                  const streamChannel = entry.streamChannel ?? index;
                  const monitor = lab.channelMonitors[streamChannel] ?? {
                    muted: false,
                    solo: false,
                    gain: 1,
                  };
                  return (
                    <ChannelMixerStrip
                      key={entry.label}
                      label={entry.label}
                      index={index}
                      muted={monitor.muted}
                      solo={monitor.solo}
                      gain={monitor.gain}
                      onMute={() =>
                        controller.setChannelMonitor(streamChannel, { muted: !monitor.muted })
                      }
                      onSolo={() =>
                        controller.setChannelMonitor(streamChannel, { solo: !monitor.solo })
                      }
                      onGain={(gain) => controller.setChannelMonitor(streamChannel, { gain })}
                    />
                  );
                })
              )}
            </div>
          </GlassCard>
        </div>

        <StudioBottomPanel
          tab={drawer}
          onTabChange={setDrawer}
          statusLine={`${lab.status} · ${lab.sinkStatus} · dual ${lab.secondarySinkStatus}`}
        >
          {drawer === "lab" ? (
            <AudioLabPanel controller={controller} snapshot={lab} compact />
          ) : drawer === "diagnostics" ? (
            <DiagnosticsPanel
              snapshot={diagnostics}
              control={control}
              autoTune={autoTune}
              busy={labBusy}
              onMeasureNetwork={() => void handleMeasureNetwork()}
              onAutoTune={() => void handleAutoTune()}
              onCopyDebug={() => void handleCopyDebug()}
            />
          ) : null}
        </StudioBottomPanel>
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
  experiencePresetId,
  aiAssistMode,
  monitoring,
  subjectiveFeel,
  running,
  onExperiencePreset,
  onAiAssist,
  onSubjectiveFeel,
  onMode,
  onSampleRate,
}: {
  pathMs: number | null;
  baseMs: number | null;
  outMs: number | null;
  mode: LatencyMode;
  sampleRate: number | null;
  preferredSampleRate: number | null;
  experiencePresetId: ExperiencePresetId;
  aiAssistMode: AiAssistMode;
  monitoring: boolean;
  subjectiveFeel: SubjectiveFeelScore | null;
  running: boolean;
  onExperiencePreset: (id: ExperiencePresetId) => void;
  onAiAssist: (mode: AiAssistMode) => void;
  onSubjectiveFeel: (score: SubjectiveFeelScore | null) => void;
  onMode: (mode: LatencyMode) => void;
  onSampleRate: (rate: number | null) => void;
}) {
  const activePreset = EXPERIENCE_PRESETS.find((preset) => preset.id === experiencePresetId);
  const activeAi = AI_ASSIST_OPTIONS.find((option) => option.id === aiAssistMode);
  const playPresets = listPresetsByGroup("play");
  const abPresets = listPresetsByGroup("ab");
  const isAb = activePreset?.group === "ab";

  return (
    <div className="flex max-w-full flex-col gap-1 rounded-xl border border-white/8 bg-studio-bg/40 px-2 py-1">
      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span
          className={`rounded-full border px-2 py-0.5 tabular-nums ${
            pathMs !== null && pathMs > 40
              ? "border-amber-400/50 bg-amber-400/10 text-amber-400"
              : "border-studio-accent/40 bg-studio-accent/10 text-studio-accent"
          }`}
          title="localMonitorPathMs = base+output only — not full guitar→ear (ADR-018)"
        >
          {running && pathMs !== null ? `${pathMs.toFixed(0)} ms path · partial` : "— ms"}
        </span>
        <span className="hidden text-studio-dim sm:inline">
          base {baseMs !== null ? `${(baseMs * 1000).toFixed(0)}` : "—"} · out{" "}
          {outMs !== null ? `${(outMs * 1000).toFixed(0)}` : "—"} · {sampleRate ?? "—"} Hz · mon{" "}
          {monitoring ? "on" : "off"}
        </span>
        <span className="text-studio-dim">Play</span>
        {playPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            title={preset.summary}
            className={`rounded border px-1.5 py-0.5 ${
              experiencePresetId === preset.id
                ? "border-studio-accent text-studio-accent"
                : "border-studio-line text-studio-dim"
            }`}
            onClick={() => onExperiencePreset(preset.id)}
          >
            {preset.shortLabel}
          </button>
        ))}
        <span className="ml-1 text-studio-dim" title={activeAi?.summary}>
          IA
        </span>
        <select
          className="rounded border border-studio-line bg-studio-bg px-1 py-0.5 text-studio-mist"
          value={aiAssistMode}
          title={activeAi?.summary}
          onChange={(event) => onAiAssist(event.target.value as AiAssistMode)}
          aria-label="IA assist (optional)"
        >
          {AI_ASSIST_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
              {option.status === "inactive-stub" ? " (stub)" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="font-medium text-studio-accent">A/B feel</span>
        {abPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            title={preset.summary}
            className={`rounded border px-1.5 py-0.5 ${
              experiencePresetId === preset.id
                ? "border-studio-accent bg-studio-accent/15 text-studio-accent"
                : "border-studio-line text-studio-dim"
            }`}
            onClick={() => onExperiencePreset(preset.id)}
          >
            {preset.shortLabel}
          </button>
        ))}
        {isAb ? (
          <>
            <span className="text-studio-dim">Feel</span>
            {([1, 2, 3, 4, 5] as const).map((score) => (
              <button
                key={score}
                type="button"
                className={`min-w-6 rounded border px-1.5 py-0.5 tabular-nums ${
                  subjectiveFeel === score
                    ? "border-studio-accent bg-studio-accent text-studio-bg"
                    : "border-studio-line text-studio-mist hover:border-studio-accent/50"
                }`}
                onClick={() => onSubjectiveFeel(score)}
                aria-label={`Feel score ${score}`}
              >
                {score}
              </button>
            ))}
            {subjectiveFeel !== null ? (
              <span className="text-studio-accent">{subjectiveFeel}/5 · Copy JSON</span>
            ) : (
              <span className="text-studio-dim">play → score</span>
            )}
          </>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span
          className="hidden max-w-[32rem] truncate text-studio-dim lg:inline"
          title={
            activePreset
              ? `${activePreset.summary} · ${hardwareDirectMonitorLabel(activePreset.hardwareDirectMonitor)}`
              : undefined
          }
        >
          {activePreset
            ? `${activePreset.summary} · mon ${monitoring ? "on" : "off"} · ${hardwareDirectMonitorLabel(activePreset.hardwareDirectMonitor)}`
            : null}
        </span>
        {(["live", "record", "rehearsal", "mix"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={`rounded border px-1.5 py-0.5 capitalize ${
              mode === item ? "border-studio-fog/70 text-studio-fog" : "border-studio-line text-studio-dim"
            }`}
            onClick={() => onMode(item)}
            title="Low-level AudioContext latencyHint (overrides after Experience)"
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
    </div>
  );
}
