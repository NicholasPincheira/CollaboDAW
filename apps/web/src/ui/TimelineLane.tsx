const TRACK_COLORS = [
  "bg-violet-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-emerald-500",
] as const;

/** Decorative lane placeholder until recording clips exist. */
export function TimelineLane({
  label,
  index,
  rowHeightClass,
}: {
  label: string;
  index: number;
  rowHeightClass: string;
}) {
  const color = TRACK_COLORS[index % TRACK_COLORS.length];
  const blockStart = 8 + (index * 11) % 40;
  const blockWidth = 22 + (index * 7) % 28;

  return (
    <div className={`flex ${rowHeightClass} items-center border-b border-white/5 px-3`}>
      <div className="relative h-10 w-full overflow-hidden rounded-lg bg-studio-elevated/40">
        <div
          className={`absolute top-1 bottom-1 rounded-md border border-white/5 ${color}/25`}
          style={{ left: `${blockStart}%`, width: `${blockWidth}%` }}
        >
          <div className="flex h-full items-center gap-px overflow-hidden px-1">
            {Array.from({ length: 24 }).map((_, barIndex) => (
              <div
                key={barIndex}
                className={`w-0.5 ${color} rounded-full opacity-60`}
                style={{ height: `${22 + ((barIndex * 17 + index * 13) % 55)}%` }}
              />
            ))}
          </div>
        </div>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-studio-dim/60 md:hidden">
          {label}
        </span>
      </div>
    </div>
  );
}
