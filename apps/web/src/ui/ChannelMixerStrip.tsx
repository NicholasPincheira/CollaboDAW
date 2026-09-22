import { Headphones, Volume2, VolumeX } from "lucide-react";

const TRACK_COLORS = [
  "bg-violet-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-emerald-500",
] as const;

export function ChannelMixerStrip({
  label,
  index,
  muted,
  solo,
  gain,
  onMute,
  onSolo,
  onGain,
}: {
  label: string;
  index: number;
  muted: boolean;
  solo: boolean;
  gain: number;
  onMute: () => void;
  onSolo: () => void;
  onGain: (gain: number) => void;
}) {
  const color = TRACK_COLORS[index % TRACK_COLORS.length];
  const gainPct = Math.round(gain * 100);

  return (
    <div className="flex items-center gap-3 border-b border-white/5 px-3 py-2.5 transition-colors hover:bg-white/3">
      <div className={`h-8 w-1.5 shrink-0 rounded-full ${color} ${muted ? "opacity-30" : "opacity-100"}`} />
      <div className="w-20 shrink-0">
        <p className="truncate text-xs font-medium text-studio-fog">{label}</p>
        <p className="truncate text-[10px] text-studio-dim">Input {index + 1}</p>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={gainPct}
        onChange={(event) => onGain(Number(event.target.value) / 100)}
        className="studio-range"
        aria-label={`${label} gain`}
      />
      <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-studio-dim">{gainPct}%</span>
      <button
        type="button"
        onClick={onMute}
        className={`rounded-lg p-1.5 transition-colors ${
          muted ? "bg-red-500/20 text-red-400" : "text-studio-dim hover:bg-white/8 hover:text-studio-mist"
        }`}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      </button>
      <button
        type="button"
        onClick={onSolo}
        className={`rounded-lg p-1.5 transition-colors ${
          solo ? "bg-studio-accent/20 text-studio-accent" : "text-studio-dim hover:bg-white/8 hover:text-studio-mist"
        }`}
        aria-label={solo ? "Unsolo" : "Solo"}
      >
        <Headphones className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export { TRACK_COLORS };
