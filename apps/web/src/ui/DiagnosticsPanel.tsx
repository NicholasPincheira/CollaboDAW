import type { ControlPlaneMetrics } from "../domain/session/control-plane-probe.ts";
import type { DiagnosticsSnapshot } from "../application/bootstrap-diagnostics.ts";
import type { AutoTuneReport } from "../application/audio-lab/latency-lab.ts";

const GROUPS = [
  { id: "audio" as const, title: "Audio" },
  { id: "device" as const, title: "Device" },
  { id: "network" as const, title: "Network" },
  { id: "sync" as const, title: "Sync" },
];

export function DiagnosticsPanel({
  snapshot,
  control,
  autoTune,
  busy,
  onMeasureNetwork,
  onAutoTune,
  onCopyDebug,
}: {
  snapshot: DiagnosticsSnapshot;
  control: ControlPlaneMetrics | null;
  autoTune: AutoTuneReport | null;
  busy: boolean;
  onMeasureNetwork: () => void;
  onAutoTune: () => void;
  onCopyDebug: () => void;
}) {
  return (
    <section aria-labelledby="diagnostics-heading" className="p-1">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 id="diagnostics-heading" className="text-sm tracking-[0.16em] text-studio-amber uppercase">
          Diagnostics
        </h2>
        <p className="text-xs text-studio-dim">Live readings · media sync after WebRTC</p>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onMeasureNetwork}
            className="rounded-lg border border-studio-line px-2 py-1 text-[11px] text-studio-mist disabled:opacity-40"
          >
            Measure network
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onAutoTune}
            className="rounded-lg border border-studio-accent/50 px-2 py-1 text-[11px] text-studio-accent disabled:opacity-40"
          >
            Auto-tune path
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onCopyDebug}
            className="rounded-lg border border-studio-line px-2 py-1 text-[11px] text-studio-mist disabled:opacity-40"
          >
            Copy debug JSON
          </button>
        </div>
      </div>

      {autoTune ? (
        <p className="mb-3 rounded-lg border border-studio-line bg-studio-elevated/50 px-3 py-2 text-xs text-studio-mist">
          {autoTune.note}
          {autoTune.best ? ` · tried ${autoTune.tried.length} configs` : ""}
        </p>
      ) : null}
      {control?.updatedAt ? (
        <p className="mb-3 text-[11px] text-studio-dim">
          Last control probe: {new Date(control.updatedAt).toLocaleTimeString()} · {control.samples}{" "}
          samples
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map((group) => (
          <div key={group.id}>
            <h3 className="mb-2 text-xs tracking-[0.14em] text-studio-dim uppercase">{group.title}</h3>
            <dl className="space-y-1 text-sm">
              {snapshot.readings
                .filter((item) => item.group === group.id)
                .map((item) => (
                  <div key={item.id} className="flex items-baseline justify-between gap-4">
                    <dt className="text-studio-mist">{item.label}</dt>
                    <dd className="text-right text-studio-fog">{item.value}</dd>
                  </div>
                ))}
            </dl>
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-1 text-xs text-studio-dim">
        {snapshot.notices.map((notice) => (
          <li key={notice}>{notice}</li>
        ))}
      </ul>
    </section>
  );
}
