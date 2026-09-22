import type { ReactNode } from "react";
import { Activity, Settings2, X } from "lucide-react";

export type StudioDrawerTab = "closed" | "lab" | "diagnostics";

/**
 * Compact footer chrome. Open tabs float as an overlay sheet above the footer
 * so the timeline / mixer are never pushed down.
 */
export function StudioBottomPanel({
  tab,
  onTabChange,
  statusLine,
  children,
}: {
  tab: StudioDrawerTab;
  onTabChange: (tab: StudioDrawerTab) => void;
  statusLine: string;
  children: ReactNode;
}) {
  const open = tab !== "closed";

  return (
    <footer className="relative z-30 shrink-0" aria-label="Studio tools">
      {open ? (
        <button
          type="button"
          className="absolute inset-x-0 bottom-full z-0 h-[min(70dvh,40rem)] cursor-default bg-black/35 backdrop-blur-[2px]"
          aria-label="Close studio tools"
          onClick={() => onTabChange("closed")}
        />
      ) : null}

      {open ? (
        <div
          className="absolute inset-x-0 bottom-full z-10 mb-1.5 flex h-[min(48dvh,28rem)] max-h-[min(52dvh,30rem)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-studio-panel/92 shadow-[0_-16px_48px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label={tab === "lab" ? "Audio Lab" : "Diagnostics"}
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-white/8 px-2.5 py-1">
            <span className="text-[10px] font-semibold tracking-[0.16em] text-studio-accent uppercase">
              {tab === "lab" ? "Audio Lab" : "Diagnostics"}
            </span>
            <span className="min-w-0 flex-1 truncate text-[10px] text-studio-dim">{statusLine}</span>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-studio-dim hover:bg-white/5 hover:text-studio-mist"
              onClick={() => onTabChange("closed")}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-hidden px-2 py-1.5 sm:px-2.5">
            {children}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-white/8 bg-studio-panel/80 px-1.5 py-1 shadow-[0_-8px_24px_rgba(0,0,0,0.28)] backdrop-blur-md sm:gap-1.5 sm:px-2">
        <TabButton
          active={tab === "lab"}
          label="Audio Lab"
          icon={<Settings2 className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => onTabChange(tab === "lab" ? "closed" : "lab")}
        />
        <TabButton
          active={tab === "diagnostics"}
          label="Diagnostics"
          icon={<Activity className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => onTabChange(tab === "diagnostics" ? "closed" : "diagnostics")}
        />
        <span className="mx-1 hidden h-4 w-px bg-white/10 sm:block" aria-hidden />
        <span className="min-w-0 flex-1 truncate px-1 text-[10px] text-studio-dim">{statusLine}</span>
      </div>
    </footer>
  );
}

function TabButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
        active
          ? "bg-studio-accent/20 text-studio-accent ring-1 ring-studio-accent/40"
          : "text-studio-mist hover:bg-white/5"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
