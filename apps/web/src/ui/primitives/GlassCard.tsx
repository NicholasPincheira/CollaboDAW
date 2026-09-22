import type { ReactNode } from "react";

export function GlassCard({
  children,
  className = "",
  hover = false,
  padding = "p-5",
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/8 bg-studio-panel/45 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md ${padding} ${
        hover ? "transition-colors hover:border-studio-accent/30" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
