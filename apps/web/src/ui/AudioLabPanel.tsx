import { useState } from "react";
import { Mic, Play, RefreshCw, Square, Volume2, VolumeX } from "lucide-react";
import type { AudioLabController, AudioLabSnapshot } from "../application/audio-lab/audio-lab-controller.ts";
import type { ChannelMapEntry } from "../domain/audio/channel-mapper.ts";
import { listPresetsByGroup } from "../domain/audio/experience-presets.ts";
import { StudioDragStrip } from "./StudioDragStrip.tsx";

const selectClass =
  "studio-input !py-1.5 !px-2 !text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-studio-accent";

const chipClass =
  "rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-studio-fog transition-colors hover:border-studio-accent/30 disabled:cursor-not-allowed disabled:text-studio-dim";

const buttonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-studio-fog transition-colors hover:border-studio-accent/30 disabled:cursor-not-allowed disabled:text-studio-dim";

export function AudioLabPanel({
  controller,
  snapshot,
  compact = false,
}: {
  controller: AudioLabController;
  snapshot: AudioLabSnapshot;
  compact?: boolean;
}) {
  const [stripId, setStripId] = useState("io");
  const inputs = snapshot.devices.filter((device) => device.kind === "audioinput");
  const outputs = snapshot.devices.filter((device) => device.kind === "audiooutput");
  const running = snapshot.status === "running";
  const busy =
    snapshot.status === "starting" ||
    snapshot.status === "stopping" ||
    snapshot.status === "requesting-permission";
  const channelCount = snapshot.diagnostics.inputChannelCount ?? 0;

  if (compact) {
    return (
      <section aria-labelledby="audio-lab-heading">
        <h2 id="audio-lab-heading" className="sr-only">
          Audio Lab
        </h2>
        {snapshot.error ? (
          <p
            className="mb-2 rounded-md border border-studio-line px-2 py-1.5 text-[11px] text-studio-amber"
            role="alert"
          >
            {snapshot.error.message}
          </p>
        ) : null}
        <StudioDragStrip
          activeId={stripId}
          onSelect={setStripId}
          sections={[
            {
              id: "io",
              label: "Devices",
              hint: snapshot.status,
              content: (
                <IoSection
                  controller={controller}
                  snapshot={snapshot}
                  inputs={inputs}
                  outputs={outputs}
                  busy={busy}
                  running={running}
                />
              ),
            },
            {
              id: "presets",
              label: "Presets",
              hint: snapshot.experiencePresetId,
              content: <PresetsSection controller={controller} snapshot={snapshot} busy={busy} />,
            },
            {
              id: "map",
              label: "Map",
              hint: snapshot.channelMap.mode,
              content: (
                <MapSection
                  controller={controller}
                  snapshot={snapshot}
                  channelCount={channelCount}
                  running={running}
                />
              ),
            },
            {
              id: "meters",
              label: "Meters",
              hint: `${snapshot.meters.length} ch`,
              content: <MetersSection snapshot={snapshot} />,
            },
          ]}
        />
      </section>
    );
  }

  return (
    <section
      className="rounded-2xl border border-white/8 bg-studio-panel/45 p-4 backdrop-blur-md"
      aria-labelledby="audio-lab-heading"
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="audio-lab-heading" className="text-sm tracking-[0.16em] text-studio-amber uppercase">
          Audio Lab
        </h2>
        <p className="text-xs text-studio-dim">Status: {snapshot.status}</p>
      </div>
      {snapshot.error ? (
        <p className="mb-3 border border-studio-line px-3 py-2 text-sm text-studio-amber" role="alert">
          {snapshot.error.message}
        </p>
      ) : null}
      <IoSection
        controller={controller}
        snapshot={snapshot}
        inputs={inputs}
        outputs={outputs}
        busy={busy}
        running={running}
      />
      <div className="mt-4">
        <PresetsSection controller={controller} snapshot={snapshot} busy={busy} />
      </div>
      <div className="mt-4">
        <MapSection
          controller={controller}
          snapshot={snapshot}
          channelCount={channelCount}
          running={running}
        />
      </div>
      <div className="mt-4">
        <MetersSection snapshot={snapshot} />
      </div>
    </section>
  );
}

function IoSection({
  controller,
  snapshot,
  inputs,
  outputs,
  busy,
  running,
}: {
  controller: AudioLabController;
  snapshot: AudioLabSnapshot;
  inputs: AudioLabSnapshot["devices"];
  outputs: AudioLabSnapshot["devices"];
  busy: boolean;
  running: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={`${buttonClass} border-studio-accent/40 bg-studio-accent/15 text-studio-accent`}
          disabled={busy}
          onClick={() => void controller.requestPermission()}
          title="Request mic permission and unlock audio in the browser"
        >
          <Mic className="h-3.5 w-3.5" aria-hidden />
          Allow audio
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={busy}
          onClick={() => void controller.refreshDevices()}
        >
          <RefreshCw className="h-3 w-3" aria-hidden />
          Refresh
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={busy || running || !snapshot.inputDeviceId}
          onClick={() => void controller.startAudio()}
        >
          <Play className="h-3 w-3" aria-hidden />
          Start
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={busy || !running}
          onClick={() => void controller.stopAudio()}
        >
          <Square className="h-3 w-3" aria-hidden />
          Stop
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={!running}
          onClick={() => controller.setMonitoring(!snapshot.monitoring)}
          aria-pressed={snapshot.monitoring}
        >
          {snapshot.monitoring ? (
            <VolumeX className="h-3 w-3" aria-hidden />
          ) : (
            <Volume2 className="h-3 w-3" aria-hidden />
          )}
          {snapshot.monitoring ? "Mon on" : "Mon off"}
        </button>
      </div>

      <label className="block">
        <span className="mb-0.5 block text-[10px] text-studio-mist">Input</span>
        <select
          className={selectClass}
          value={snapshot.inputDeviceId ?? ""}
          disabled={running || busy}
          onChange={(event) => controller.selectInput(event.target.value)}
        >
          <option value="">Select input</option>
          {inputs.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-0.5 block text-[10px] text-studio-mist">
          Primary out{!snapshot.capabilities.setSinkId ? " (default only)" : ""}
        </span>
        <select
          className={selectClass}
          value={snapshot.outputDeviceId ?? ""}
          disabled={busy || !snapshot.capabilities.setSinkId}
          onChange={(event) => controller.selectOutput(event.target.value)}
        >
          <option value="">Default output</option>
          {outputs.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
        <span className="mt-0.5 block text-[10px] text-studio-dim">Sink: {snapshot.sinkStatus}</span>
      </label>

      <label className="block">
        <span className="mb-0.5 block text-[10px] text-studio-mist">Secondary out</span>
        <select
          className={selectClass}
          value={snapshot.secondaryOutputDeviceId ?? ""}
          disabled={busy || !snapshot.capabilities.setSinkId}
          onChange={(event) => controller.selectSecondaryOutput(event.target.value)}
        >
          <option value="">Off</option>
          {outputs.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
        <span className="mt-0.5 block text-[10px] text-studio-dim">
          Dual: {snapshot.secondarySinkStatus}
        </span>
      </label>
    </div>
  );
}

function PresetsSection({
  controller,
  snapshot,
  busy,
}: {
  controller: AudioLabController;
  snapshot: AudioLabSnapshot;
  busy: boolean;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="mb-1 text-[10px] tracking-[0.12em] text-studio-dim uppercase">Play</p>
        <div className="flex flex-wrap gap-1">
          {listPresetsByGroup("play").map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`${chipClass} ${snapshot.experiencePresetId === preset.id ? "border-studio-accent text-studio-accent" : ""}`}
              disabled={busy}
              title={preset.summary}
              onClick={() => void controller.applyExperiencePreset(preset.id)}
            >
              {preset.shortLabel}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-[10px] tracking-[0.12em] text-studio-accent uppercase">A/B feel</p>
        <div className="flex flex-wrap gap-1">
          {listPresetsByGroup("ab").map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`${chipClass} ${snapshot.experiencePresetId === preset.id ? "border-studio-accent text-studio-accent" : ""}`}
              disabled={busy}
              title={preset.summary}
              onClick={() => void controller.applyExperiencePreset(preset.id)}
            >
              {preset.shortLabel}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-0.5 block text-[10px] text-studio-mist">IA assist</span>
        <select
          className={selectClass}
          value={snapshot.aiAssistMode}
          disabled={busy}
          onChange={(event) =>
            controller.setAiAssistMode(event.target.value as typeof snapshot.aiAssistMode)
          }
        >
          <option value="off">Off</option>
          <option value="remote-plc">Remote PLC (stub)</option>
          <option value="experimental">Experimental (stub)</option>
        </select>
      </label>
      <div>
        <p className="mb-1 text-[10px] tracking-[0.12em] text-studio-dim uppercase">Latency hint</p>
        <div className="flex flex-wrap gap-1">
          {(["live", "record", "rehearsal", "mix"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`${chipClass} ${snapshot.latencyMode === mode ? "border-studio-accent text-studio-accent" : ""}`}
              disabled={busy}
              onClick={() => void controller.setLatencyMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-0.5 block text-[10px] text-studio-mist">Sample rate</span>
        <select
          className={selectClass}
          value={snapshot.preferredSampleRate ?? ""}
          disabled={busy}
          onChange={(event) => {
            const value = event.target.value;
            void controller.setPreferredSampleRate(value ? Number(value) : null);
          }}
        >
          <option value="48000">48000 Hz</option>
          <option value="44100">44100 Hz</option>
          <option value="">Browser default</option>
        </select>
      </label>
    </div>
  );
}

function MapSection({
  controller,
  snapshot,
  channelCount,
  running,
}: {
  controller: AudioLabController;
  snapshot: AudioLabSnapshot;
  channelCount: number;
  running: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] text-studio-fog">
        {snapshot.profile
          ? `${snapshot.profile.manufacturer} ${snapshot.profile.model}`
          : "Generic / unknown"}
        <span className="text-studio-dim"> · {snapshot.channelMap.mode}</span>
      </p>
      <ul className="space-y-1.5">
        {snapshot.channelMap.entries.map((entry) => (
          <ChannelMapRow
            key={entry.label}
            entry={entry}
            channelCount={channelCount}
            disabled={!running && channelCount === 0}
            onChange={(streamChannel) => controller.remapChannel(entry.label, streamChannel)}
            onLearn={() => controller.startLearnInput(entry.label)}
          />
        ))}
      </ul>
      <button type="button" className={buttonClass} onClick={() => controller.clearOverrides()}>
        Reset map
      </button>
      {snapshot.learn.message ? (
        <div className="rounded-md border border-studio-line px-2 py-1.5 text-[11px] text-studio-mist">
          <p>{snapshot.learn.message}</p>
          {snapshot.learn.phase === "awaiting-confirm" ? (
            <div className="mt-1.5 flex gap-1.5">
              <button type="button" className={buttonClass} onClick={() => controller.confirmLearnInput()}>
                Confirm
              </button>
              <button type="button" className={buttonClass} onClick={() => controller.cancelLearn()}>
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MetersSection({ snapshot }: { snapshot: AudioLabSnapshot }) {
  if (snapshot.meters.length === 0) {
    return <p className="text-[11px] text-studio-mist">Start audio to see meters.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {snapshot.meters.map((meter) => (
        <li key={`${meter.label}-${meter.streamChannel}`}>
          <div className="mb-0.5 flex justify-between text-[10px] text-studio-mist">
            <span>
              {meter.label} <span className="text-studio-dim">ch {meter.streamChannel}</span>
            </span>
            <span className="font-mono tabular-nums">{(meter.peak * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-studio-bg" aria-hidden="true">
            <div
              className="h-1.5 rounded-full bg-studio-amber meter-fill"
              style={{ width: `${Math.min(100, meter.peak * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChannelMapRow({
  entry,
  channelCount,
  disabled,
  onChange,
  onLearn,
}: {
  entry: ChannelMapEntry;
  channelCount: number;
  disabled: boolean;
  onChange: (streamChannel: number | null) => void;
  onLearn: () => void;
}) {
  const options = Math.max(channelCount, entry.streamChannel !== null ? entry.streamChannel + 1 : 0, 2);
  return (
    <li className="grid grid-cols-[1fr_auto] gap-1.5 sm:grid-cols-[1fr_5.5rem_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-[11px] text-studio-fog">{entry.label}</p>
        <p className="truncate text-[10px] text-studio-dim">
          {entry.type} · {entry.source}
        </p>
      </div>
      <select
        className={selectClass}
        disabled={disabled}
        value={entry.streamChannel === null ? "" : String(entry.streamChannel)}
        onChange={(event) => {
          const value = event.target.value;
          onChange(value === "" ? null : Number(value));
        }}
        aria-label={`Stream channel for ${entry.label}`}
      >
        <option value="">—</option>
        {Array.from({ length: options }, (_, index) => (
          <option key={index} value={index}>
            ch {index}
          </option>
        ))}
      </select>
      <button type="button" className={buttonClass} disabled={disabled} onClick={onLearn}>
        Learn
      </button>
    </li>
  );
}
