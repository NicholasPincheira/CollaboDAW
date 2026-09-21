import type { AudioLabController, AudioLabSnapshot } from "../application/audio-lab/audio-lab-controller.ts";
import type { ChannelMapEntry } from "../domain/audio/channel-mapper.ts";

const selectClass =
  "w-full rounded-xl border border-studio-line bg-studio-bg px-2 py-2 text-sm text-studio-fog focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-studio-amber";

const buttonClass =
  "rounded-xl border border-studio-line px-3 py-2 text-sm text-studio-fog disabled:cursor-not-allowed disabled:text-studio-dim focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-studio-amber";

export function AudioLabPanel({
  controller,
  snapshot,
  compact = false,
}: {
  controller: AudioLabController;
  snapshot: AudioLabSnapshot;
  compact?: boolean;
}) {
  const inputs = snapshot.devices.filter((device) => device.kind === "audioinput");
  const outputs = snapshot.devices.filter((device) => device.kind === "audiooutput");
  const running = snapshot.status === "running";
  const busy = snapshot.status === "starting" || snapshot.status === "stopping" || snapshot.status === "requesting-permission";
  const channelCount = snapshot.diagnostics.inputChannelCount ?? 0;

  return (
    <section
      className={compact ? "p-1" : "rounded-2xl border border-studio-line bg-studio-elevated p-4"}
      aria-labelledby="audio-lab-heading"
    >
      {!compact ? (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="audio-lab-heading" className="text-sm tracking-[0.16em] text-studio-amber uppercase">
            Audio Lab
          </h2>
          <p className="text-xs text-studio-dim">Status: {snapshot.status}</p>
        </div>
      ) : (
        <h2 id="audio-lab-heading" className="sr-only">
          Audio Lab
        </h2>
      )}

      {snapshot.error ? (
        <p className="mb-3 border border-studio-line px-3 py-2 text-sm text-studio-amber" role="alert">
          {snapshot.error.message}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1 block text-studio-mist">Input device</span>
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

        <label className="block text-sm">
          <span className="mb-1 block text-studio-mist">
            Primary output (e.g. interface)
            {!snapshot.capabilities.setSinkId ? " — browser default only" : ""}
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
          <span className="mt-1 block text-[11px] text-studio-dim">Sink: {snapshot.sinkStatus}</span>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-studio-mist">Secondary output (e.g. headphones)</span>
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
          <span className="mt-1 block text-[11px] text-studio-dim">
            Dual: {snapshot.secondarySinkStatus} · not sample-locked across devices
          </span>
        </label>
      </div>

      <div className={compact ? "mt-2" : "mt-4"}>
        <p className="mb-2 text-xs tracking-[0.14em] text-studio-dim uppercase">Latency preset</p>
        <div className="flex flex-wrap gap-2">
          {(["live", "record", "rehearsal", "mix"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`${buttonClass} ${snapshot.latencyMode === mode ? "border-studio-accent text-studio-accent" : ""}`}
              disabled={busy}
              onClick={() => void controller.setLatencyMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
        <label className="mt-2 block text-xs text-studio-mist">
          Preferred sample rate
          <select
            className={`${selectClass} mt-1`}
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
        <p className="mt-2 text-[11px] text-studio-dim">
          Changing preset/rate recreates AudioContext. Lowest feel: interface Direct Monitor ON + software
          monitor muted. Dual sinks are not sample-locked.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={buttonClass} disabled={busy} onClick={() => void controller.requestPermission()}>
          Allow microphone
        </button>
        <button type="button" className={buttonClass} disabled={busy} onClick={() => void controller.refreshDevices()}>
          Refresh devices
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={busy || running || !snapshot.inputDeviceId}
          onClick={() => void controller.startAudio()}
        >
          Start audio
        </button>
        <button type="button" className={buttonClass} disabled={busy || !running} onClick={() => void controller.stopAudio()}>
          Stop audio
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={!running}
          onClick={() => controller.setMonitoring(!snapshot.monitoring)}
          aria-pressed={snapshot.monitoring}
        >
          {snapshot.monitoring ? "Mute monitor" : "Enable monitor"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-xs tracking-[0.14em] text-studio-dim uppercase">Profile</h3>
          <p className="text-sm text-studio-fog">
            {snapshot.profile
              ? `${snapshot.profile.manufacturer} ${snapshot.profile.model}`
              : "Generic / unknown"}
          </p>
          <p className="mt-1 text-xs text-studio-mist">Mode: {snapshot.channelMap.mode}</p>
          {snapshot.profile?.notes[0] ? (
            <p className="mt-2 text-xs text-studio-dim">{snapshot.profile.notes[0]}</p>
          ) : null}
        </div>

        <div>
          <h3 className="mb-2 text-xs tracking-[0.14em] text-studio-dim uppercase">Channel map</h3>
          <ul className="space-y-2">
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
          <button type="button" className={`${buttonClass} mt-3`} onClick={() => controller.clearOverrides()}>
            Reset mapping overrides
          </button>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-xs tracking-[0.14em] text-studio-dim uppercase">Meters</h3>
        {snapshot.meters.length === 0 ? (
          <p className="text-sm text-studio-mist">Start audio to see channel meters.</p>
        ) : (
          <ul className="space-y-2">
            {snapshot.meters.map((meter) => (
              <li key={`${meter.label}-${meter.streamChannel}`}>
                <div className="mb-1 flex justify-between text-xs text-studio-mist">
                  <span>
                    {meter.label} <span className="text-studio-dim">(ch {meter.streamChannel})</span>
                  </span>
                  <span>{(meter.peak * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-studio-bg" aria-hidden="true">
                  <div
                    className="h-2 rounded-full bg-studio-amber meter-fill"
                    style={{ width: `${Math.min(100, meter.peak * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {snapshot.learn.message ? (
        <div className="mt-4 border border-studio-line px-3 py-2 text-sm text-studio-mist">
          <p>{snapshot.learn.message}</p>
          {snapshot.learn.phase === "awaiting-confirm" ? (
            <div className="mt-2 flex gap-2">
              <button type="button" className={buttonClass} onClick={() => controller.confirmLearnInput()}>
                Confirm learned map
              </button>
              <button type="button" className={buttonClass} onClick={() => controller.cancelLearn()}>
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
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
    <li className="grid gap-2 sm:grid-cols-[1fr_7rem_auto] sm:items-center">
      <div>
        <p className="text-sm text-studio-fog">{entry.label}</p>
        <p className="text-xs text-studio-dim">
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
        <option value="">Unmapped</option>
        {Array.from({ length: options }, (_, index) => (
          <option key={index} value={index}>
            Stream ch {index}
          </option>
        ))}
      </select>
      <button type="button" className={buttonClass} disabled={disabled} onClick={onLearn}>
        Learn
      </button>
    </li>
  );
}
