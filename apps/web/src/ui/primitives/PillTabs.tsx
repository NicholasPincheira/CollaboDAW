export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: ReadonlyArray<{ id: T; label: string }>;
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-studio-elevated/60 p-1 backdrop-blur-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
            value === tab.id
              ? "bg-linear-to-r from-studio-accent to-cyan-400 text-studio-bg shadow-[0_0_16px_rgba(61,214,198,0.3)]"
              : "text-studio-dim hover:text-studio-mist"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
