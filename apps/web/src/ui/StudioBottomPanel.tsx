import type { ReactNode } from "react";
import { Activity, ChevronDown, Settings2, X } from "lucide-react";

export type StudioDrawerTab = "closed" | "lab" | "diagnostics";

/**
 * Bottom horizontal studio panel (~35% viewport height when open).
 * Parent must be a flex column with `h-dvh` so the center area shrinks.
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
    <section
      className={`mt-2 flex shrink-0 flex-col overflow-hidden rounded-2xl border border-white/8 bg-studio-panel/55 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md ${
        open ? "h-[min(35dvh,22rem)] min-h-[11rem] sm:h-[35dvh] sm:min-h-[14rem] sm:max-h-[40dvh]" : ""
      }`}
      aria-label="Studio tools"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-white/8 px-2 py-1.5 sm:gap-2 sm:px-3">
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
        <span className="min-w-0 flex-1 truncate text-[10px] text-studio-dim sm:flex-none">
          {statusLine}
        </span>
        {open ? (
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-studio-dim hover:bg-white/5 hover:text-studio-mist"
            onClick={() => onTabChange("closed")}
          >
            <ChevronDown className="h-3.5 w-3.5 sm:hidden" aria-hidden />
            <X className="hidden h-3.5 w-3.5 sm:inline" aria-hidden />
            <span className="hidden sm:inline">Collapse</span>
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain px-2 py-2 sm:px-3">
          {children}
        </div>
      ) : null}
    </section>
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
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
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
