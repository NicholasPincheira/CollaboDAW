import type { DiagnosticGroup, DiagnosticsSnapshot } from "../application/bootstrap-diagnostics.ts";

const GROUPS: { id: DiagnosticGroup; title: string }[] = [
  { id: "audio", title: "Audio" },
  { id: "device", title: "Device" },
  { id: "network", title: "Network" },
  { id: "sync", title: "Sync" },
];

export function DiagnosticsPanel({ snapshot }: { snapshot: DiagnosticsSnapshot }) {
  return (
    <section
      aria-labelledby="diagnostics-heading"
      className="rounded-2xl border border-studio-line bg-studio-elevated p-4"
    >
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="diagnostics-heading" className="text-sm tracking-[0.16em] text-studio-amber uppercase">
          Diagnostics
        </h2>
        <p className="text-xs text-studio-dim">Placeholder</p>
      </div>
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
