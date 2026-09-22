import { useState } from "react";
import type { ControlPlaneMetrics } from "../domain/session/control-plane-probe.ts";
import type { DiagnosticsSnapshot } from "../application/bootstrap-diagnostics.ts";
import type { AutoTuneReport } from "../application/audio-lab/latency-lab.ts";
import { StudioDragStrip } from "./StudioDragStrip.tsx";

const GROUPS = [
  { id: "audio" as const, title: "Local audio" },
  { id: "device" as const, title: "Device" },
  { id: "network" as const, title: "Network" },
  { id: "sync" as const, title: "Sync" },
];

const buttonClass =
  "rounded-md border border-white/10 px-2 py-1 text-[11px] text-studio-mist disabled:opacity-40 hover:border-studio-accent/30";

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
  const [stripId, setStripId] = useState("actions");

  return (
    <section aria-labelledby="diagnostics-heading">
      <h2 id="diagnostics-heading" className="sr-only">
        Diagnostics
      </h2>
      <StudioDragStrip
        activeId={stripId}
        onSelect={setStripId}
        sections={[
          {
            id: "actions",
            label: "Actions",
            hint: control?.updatedAt ? "probed" : "idle",
            content: (
              <div className="space-y-2">
                <p className="text-[10px] text-studio-dim">
                  Benchmark export · IA off · docs/research/HARDWARE-BENCHMARK-TEMPLATE.md
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" disabled={busy} onClick={onMeasureNetwork} className={buttonClass}>
                    Measure network
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onAutoTune}
                    className={`${buttonClass} border-studio-accent/50 text-studio-accent`}
                  >
                    Auto-tune path
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={onCopyDebug}
                    className={`${buttonClass} border-studio-accent/40 bg-studio-accent/10 text-studio-accent`}
                  >
                    Copy JSON
                  </button>
                </div>
                {autoTune ? (
                  <p className="rounded-md border border-white/10 bg-studio-elevated/50 px-2 py-1.5 text-[10px] text-studio-mist">
                    {autoTune.note}
                    {autoTune.best ? ` · tried ${autoTune.tried.length}` : ""}
                  </p>
                ) : null}
                {control?.updatedAt ? (
                  <p className="text-[10px] text-studio-dim">
                    Last probe: {new Date(control.updatedAt).toLocaleTimeString()} · {control.samples}{" "}
                    samples
                  </p>
                ) : null}
              </div>
            ),
          },
          ...GROUPS.map((group) => ({
            id: group.id,
            label: group.title,
            hint: `${snapshot.readings.filter((item) => item.group === group.id).length} metrics`,
            content: (
              <dl className="space-y-1">
                {snapshot.readings
                  .filter((item) => item.group === group.id)
                  .map((item) => (
                    <div key={item.id} className="flex items-baseline justify-between gap-3">
                      <dt className="text-[11px] text-studio-mist">{item.label}</dt>
                      <dd className="font-mono text-right text-[11px] tabular-nums text-studio-fog">
                        {item.value}
                      </dd>
                    </div>
                  ))}
              </dl>
            ),
          })),
          {
            id: "notices",
            label: "Notices",
            hint: `${snapshot.notices.length}`,
            content: (
              <ul className="space-y-1 text-[10px] text-studio-dim">
                {snapshot.notices.length === 0 ? (
                  <li>No notices</li>
                ) : (
                  snapshot.notices.map((notice) => <li key={notice}>{notice}</li>)
                )}
              </ul>
            ),
          },
        ]}
      />
    </section>
  );
}
