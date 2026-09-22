import { Globe, Headphones, Lock, Music2, Users, Wifi } from "lucide-react";
import { GlassCard } from "./primitives/GlassCard.tsx";
import { StudioButton } from "./primitives/StudioButton.tsx";

function latencyTone(bpm: number): string {
  if (bpm >= 100) return "text-emerald-400";
  if (bpm >= 80) return "text-amber-400";
  return "text-studio-dim";
}

export function SessionRoomCard({
  name,
  id,
  bpm,
  locked,
  index,
  onOpen,
  onDelete,
  busy,
}: {
  name: string;
  id: string;
  bpm: number;
  locked: boolean;
  index: number;
  onOpen: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <li data-motion="recent" style={{ animationDelay: `${index * 60}ms` }}>
      <GlassCard hover padding="p-4" className="group flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-studio-accent/20 to-cyan-500/10">
            <Headphones className="h-5 w-5 text-studio-accent" aria-hidden />
          </div>
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-studio-panel bg-red-500" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium text-studio-fog">{name}</h3>
            {locked ? (
              <Lock className="h-3 w-3 shrink-0 text-studio-dim" aria-label="Private room" />
            ) : (
              <Globe className="h-3 w-3 shrink-0 text-studio-dim" aria-label="Unlocked" />
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-studio-dim">
            <span className="flex items-center gap-1">
              <Music2 className="h-3 w-3" aria-hidden />
              {bpm} BPM
            </span>
            <span className={`flex items-center gap-1 ${latencyTone(bpm)}`}>
              <Wifi className="h-3 w-3" aria-hidden />
              local
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" aria-hidden />
              1/8
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-[10px] text-studio-dim/80">{id}</p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <StudioButton variant="outline" className="h-9 px-4 text-xs" onClick={onOpen}>
            Unirse
          </StudioButton>
          <StudioButton
            variant="ghost"
            className="h-9 px-3 text-xs opacity-0 transition-opacity group-hover:opacity-100"
            disabled={busy}
            onClick={onDelete}
          >
            Delete
          </StudioButton>
        </div>
      </GlassCard>
    </li>
  );
}
