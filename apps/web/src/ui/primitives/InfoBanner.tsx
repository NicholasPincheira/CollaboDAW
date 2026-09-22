import type { ReactNode } from "react";
import { Wifi } from "lucide-react";

export function InfoBanner({
  title,
  children,
  icon,
}: {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-studio-accent/25 bg-studio-accent/8 px-4 py-3 backdrop-blur-sm">
      <div className="mt-0.5 shrink-0 text-studio-accent">{icon ?? <Wifi className="h-4 w-4" aria-hidden />}</div>
      <div className="min-w-0 text-sm">
        <p className="font-medium text-studio-accent">{title}</p>
        <p className="mt-0.5 text-studio-mist">{children}</p>
      </div>
    </div>
  );
}
