import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "outline" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-linear-to-r from-studio-accent to-cyan-400 text-studio-bg shadow-[0_0_24px_rgba(61,214,198,0.25)] hover:brightness-110",
  outline:
    "border border-studio-accent/35 bg-transparent text-studio-accent hover:bg-studio-accent/10",
  ghost: "border border-white/10 bg-white/5 text-studio-mist hover:bg-white/10",
  danger: "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20",
};

export function StudioButton({
  variant = "outline",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
